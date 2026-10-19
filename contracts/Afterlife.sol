// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Minimal ERC-20 surface. On Arc, USDC is the native gas token AND exposes this
///         ERC-20 interface (6 decimals) at 0x3600000000000000000000000000000000000000.
interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address who) external view returns (uint256);
}

/// @title Afterlife - a USDC dead-man's-switch / digital-inheritance vault for Arc
/// @notice An owner locks USDC in a vault, names beneficiaries with percentage shares and picks an
///         inactivity window. While the owner keeps checking in (a "heartbeat") the funds stay theirs.
///         If the owner goes silent past the window, ANYONE can release the vault and the
///         beneficiaries can claim their shares. Claims are pull-based and can be triggered by anyone
///         on a beneficiary's behalf (important on Arc, where gas is paid in USDC and a beneficiary
///         may hold none).
/// @dev    Demo/hackathon code. NOT audited. Use tiny amounts.
///         Arc specifics handled: only the 6-decimals ERC-20 interface is used (never msg.value);
///         address(0) is rejected (sends to it revert on Arc); a transfer to a blocklisted beneficiary
///         reverts only that beneficiary's claim (claimAll skips it instead of bricking everyone).
contract Afterlife {
    // ---------------------------------------------------------------- types
    enum Status { None, Active, Released, Closed }

    struct Vault {
        address owner;
        Status status;
        uint64 window;      // seconds of silence before the vault can be released
        uint64 lastCheckIn; // last proof-of-life timestamp
        uint256 balance;    // USDC (6 decimals) held while Active
        uint256 released;   // snapshot of balance at release time
        string name;
        address[] beneficiaries;
        uint16[] shares;    // basis points, sums to 10_000
        mapping(uint256 => bool) claimed; // beneficiary index => claimed?
        uint256 claimedAmount;
    }

    // ---------------------------------------------------------------- state
    uint256 public constant BPS = 10_000;
    uint256 public constant MAX_BENEFICIARIES = 10;
    uint64 public constant MAX_WINDOW = 3650 days;
    uint256 public constant MAX_NAME_BYTES = 64;

    IERC20 public immutable usdc;
    /// @notice Minimum inactivity window. Demo deployments use a short value (e.g. 60s) so the full
    ///         flow can be shown on camera; real use would pick days/months at vault creation.
    uint64 public immutable minWindow;

    uint256 public nextVaultId = 1;
    mapping(uint256 => Vault) private _vaults;
    mapping(address => uint256[]) private _ownerVaults;
    mapping(address => uint256[]) private _beneficiaryVaults; // may contain stale ids; UI filters

    uint256 private _lock = 1;

    // ---------------------------------------------------------------- events
    event VaultCreated(uint256 indexed id, address indexed owner, string name, uint64 window);
    event BeneficiariesSet(uint256 indexed id, address[] beneficiaries, uint16[] shares);
    event Deposited(uint256 indexed id, address indexed from, uint256 amount, uint256 newBalance);
    event CheckedIn(uint256 indexed id, uint64 timestamp);
    event Withdrawn(uint256 indexed id, uint256 amount, uint256 newBalance);
    event Closed(uint256 indexed id);
    event Released(uint256 indexed id, address indexed by, uint256 amount);
    event Claimed(uint256 indexed id, uint256 indexed index, address indexed beneficiary, uint256 amount);

    // ---------------------------------------------------------------- errors
    error NotOwner();
    error BadStatus();
    error BadBeneficiaries();
    error BadWindow();
    error BadName();
    error ZeroAmount();
    error StillAlive();
    error NothingToRelease();
    error AlreadyClaimed();
    error BadIndex();
    error TransferFailed();
    error Reentrancy();

    modifier nonReentrant() {
        if (_lock != 1) revert Reentrancy();
        _lock = 2;
        _;
        _lock = 1;
    }

    constructor(address usdcToken, uint64 minWindowSeconds) {
        require(usdcToken != address(0), "usdc=0");
        require(minWindowSeconds >= 1 && minWindowSeconds <= MAX_WINDOW, "minWindow");
        usdc = IERC20(usdcToken);
        minWindow = minWindowSeconds;
    }

    // ---------------------------------------------------------------- owner actions
    /// @notice Create a vault; optionally fund it in the same tx (requires prior USDC approval).
    function createVault(
        string calldata name,
        address[] calldata beneficiaries,
        uint16[] calldata shares,
        uint64 window,
        uint256 initialDeposit
    ) external nonReentrant returns (uint256 id) {
        if (bytes(name).length == 0 || bytes(name).length > MAX_NAME_BYTES) revert BadName();
        if (window < minWindow || window > MAX_WINDOW) revert BadWindow();
        _validateBeneficiaries(msg.sender, beneficiaries, shares);

        id = nextVaultId++;
        Vault storage v = _vaults[id];
        v.owner = msg.sender;
        v.status = Status.Active;
        v.window = window;
        v.lastCheckIn = uint64(block.timestamp);
        v.name = name;
        _setBeneficiaries(id, v, beneficiaries, shares);
        _ownerVaults[msg.sender].push(id);

        emit VaultCreated(id, msg.sender, name, window);
        emit BeneficiariesSet(id, beneficiaries, shares);

        if (initialDeposit > 0) _pull(id, v, initialDeposit);
    }

    /// @notice Anyone may top up an active vault (requires prior USDC approval).
    function deposit(uint256 id, uint256 amount) external nonReentrant {
        Vault storage v = _vaults[id];
        if (v.status != Status.Active) revert BadStatus();
        if (amount == 0) revert ZeroAmount();
        _pull(id, v, amount);
    }

    /// @notice Heartbeat: proves the owner is alive and restarts the inactivity timer.
    function checkIn(uint256 id) external {
        Vault storage v = _activeOwned(id);
        v.lastCheckIn = uint64(block.timestamp);
        emit CheckedIn(id, v.lastCheckIn);
    }

    /// @notice Owner pulls USDC back while the vault is still Active (also counts as a heartbeat).
    function withdraw(uint256 id, uint256 amount) external nonReentrant {
        Vault storage v = _activeOwned(id);
        if (amount == 0) revert ZeroAmount();
        if (amount > v.balance) revert ZeroAmount();
        v.balance -= amount;
        v.lastCheckIn = uint64(block.timestamp);
        _send(msg.sender, amount);
        emit Withdrawn(id, amount, v.balance);
        emit CheckedIn(id, v.lastCheckIn);
    }

    /// @notice Owner replaces the beneficiary list (also a heartbeat).
    function setBeneficiaries(uint256 id, address[] calldata beneficiaries, uint16[] calldata shares) external {
        Vault storage v = _activeOwned(id);
        _validateBeneficiaries(msg.sender, beneficiaries, shares);
        _setBeneficiaries(id, v, beneficiaries, shares);
        v.lastCheckIn = uint64(block.timestamp);
        emit BeneficiariesSet(id, beneficiaries, shares);
        emit CheckedIn(id, v.lastCheckIn);
    }

    /// @notice Owner withdraws everything and closes the vault.
    function close(uint256 id) external nonReentrant {
        Vault storage v = _activeOwned(id);
        uint256 amount = v.balance;
        v.balance = 0;
        v.status = Status.Closed;
        if (amount > 0) _send(msg.sender, amount);
        emit Closed(id);
    }

    // ---------------------------------------------------------------- release & claim
    /// @notice Anyone can release a vault whose owner has been silent longer than the window.
    function release(uint256 id) external {
        Vault storage v = _vaults[id];
        if (v.status != Status.Active) revert BadStatus();
        if (block.timestamp <= uint256(v.lastCheckIn) + v.window) revert StillAlive();
        if (v.balance == 0) revert NothingToRelease();
        v.status = Status.Released;
        v.released = v.balance;
        v.balance = 0;
        emit Released(id, msg.sender, v.released);
    }

    /// @notice Pay one beneficiary their share. Callable by anyone (e.g. a friend or a relayer paying
    ///         the gas); funds always go to the beneficiary address.
    function claim(uint256 id, uint256 index) external nonReentrant {
        Vault storage v = _vaults[id];
        if (v.status != Status.Released) revert BadStatus();
        if (index >= v.beneficiaries.length) revert BadIndex();
        if (v.claimed[index]) revert AlreadyClaimed();
        v.claimed[index] = true;
        uint256 amount = _share(v, index);
        v.claimedAmount += amount;
        _send(v.beneficiaries[index], amount);
        emit Claimed(id, index, v.beneficiaries[index], amount);
    }

    /// @notice Pay every unclaimed beneficiary in one transaction. A beneficiary whose transfer fails
    ///         (e.g. USDC-blocklisted) is skipped and can be retried via claim() later.
    function claimAll(uint256 id) external nonReentrant {
        Vault storage v = _vaults[id];
        if (v.status != Status.Released) revert BadStatus();
        uint256 n = v.beneficiaries.length;
        for (uint256 i = 0; i < n; i++) {
            if (v.claimed[i]) continue;
            uint256 amount = _share(v, i);
            if (_trySend(v.beneficiaries[i], amount)) {
                v.claimed[i] = true;
                v.claimedAmount += amount;
                emit Claimed(id, i, v.beneficiaries[i], amount);
            }
        }
    }

    // ---------------------------------------------------------------- views
    function deadline(uint256 id) public view returns (uint256) {
        Vault storage v = _vaults[id];
        return uint256(v.lastCheckIn) + v.window;
    }

    /// @return true if the vault is Active and the owner has been silent past the window
    function isExpired(uint256 id) external view returns (bool) {
        Vault storage v = _vaults[id];
        return v.status == Status.Active && block.timestamp > uint256(v.lastCheckIn) + v.window;
    }

    /// @notice Amount beneficiary `index` receives (or received) once the vault is released.
    function shareOf(uint256 id, uint256 index) external view returns (uint256) {
        Vault storage v = _vaults[id];
        if (index >= v.beneficiaries.length) revert BadIndex();
        uint256 basis = v.status == Status.Released ? v.released : v.balance;
        return _shareOf(v, basis, index);
    }

    function getVault(uint256 id)
        external
        view
        returns (
            address owner,
            string memory name,
            Status status,
            uint64 window,
            uint64 lastCheckIn,
            uint256 balance,
            uint256 released,
            uint256 claimedAmount,
            address[] memory beneficiaries,
            uint16[] memory shares,
            bool[] memory claimedFlags
        )
    {
        Vault storage v = _vaults[id];
        uint256 n = v.beneficiaries.length;
        bool[] memory flags = new bool[](n);
        for (uint256 i = 0; i < n; i++) flags[i] = v.claimed[i];
        return (v.owner, v.name, v.status, v.window, v.lastCheckIn, v.balance, v.released, v.claimedAmount, v.beneficiaries, v.shares, flags);
    }

    function vaultsOfOwner(address owner) external view returns (uint256[] memory) {
        return _ownerVaults[owner];
    }

    /// @dev may include ids where the account was later removed as beneficiary; UI filters by membership
    function vaultsOfBeneficiary(address who) external view returns (uint256[] memory) {
        return _beneficiaryVaults[who];
    }

    // ---------------------------------------------------------------- internals
    function _activeOwned(uint256 id) private view returns (Vault storage v) {
        v = _vaults[id];
        if (v.owner != msg.sender) revert NotOwner();
        if (v.status != Status.Active) revert BadStatus();
    }

    function _validateBeneficiaries(address owner, address[] calldata b, uint16[] calldata s) private pure {
        uint256 n = b.length;
        if (n == 0 || n > MAX_BENEFICIARIES || n != s.length) revert BadBeneficiaries();
        uint256 total;
        for (uint256 i = 0; i < n; i++) {
            if (b[i] == address(0) || b[i] == owner || s[i] == 0) revert BadBeneficiaries();
            for (uint256 j = 0; j < i; j++) if (b[j] == b[i]) revert BadBeneficiaries();
            total += s[i];
        }
        if (total != BPS) revert BadBeneficiaries();
    }

    function _setBeneficiaries(uint256 id, Vault storage v, address[] calldata b, uint16[] calldata s) private {
        v.beneficiaries = b;
        v.shares = s;
        for (uint256 i = 0; i < b.length; i++) _beneficiaryVaults[b[i]].push(id);
    }

    function _share(Vault storage v, uint256 index) private view returns (uint256) {
        return _shareOf(v, v.released, index);
    }

    /// @dev the last beneficiary takes the rounding remainder so shares always sum to `basis`
    function _shareOf(Vault storage v, uint256 basis, uint256 index) private view returns (uint256) {
        uint256 n = v.beneficiaries.length;
        if (index + 1 < n) return (basis * v.shares[index]) / BPS;
        uint256 others;
        for (uint256 i = 0; i + 1 < n; i++) others += (basis * v.shares[i]) / BPS;
        return basis - others;
    }

    function _pull(uint256 id, Vault storage v, uint256 amount) private {
        (bool ok, bytes memory ret) = address(usdc).call(
            abi.encodeCall(IERC20.transferFrom, (msg.sender, address(this), amount))
        );
        if (!ok || (ret.length != 0 && !abi.decode(ret, (bool)))) revert TransferFailed();
        v.balance += amount;
        emit Deposited(id, msg.sender, amount, v.balance);
    }

    function _send(address to, uint256 amount) private {
        if (!_trySend(to, amount)) revert TransferFailed();
    }

    function _trySend(address to, uint256 amount) private returns (bool) {
        (bool ok, bytes memory ret) = address(usdc).call(abi.encodeCall(IERC20.transfer, (to, amount)));
        return ok && (ret.length == 0 || abi.decode(ret, (bool)));
    }
}
