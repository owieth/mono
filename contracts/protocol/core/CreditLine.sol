// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;

import "./GoldfinchConfig.sol";
import "./ConfigHelper.sol";
import "./BaseUpgradeablePausable.sol";
import "./Accountant.sol";
import "../../interfaces/IERC20withDec.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/math/Math.sol";

/**
 * @title CreditLine
 * @notice A "dumb" state container that represents the agreement between an Underwriter and
 *  the borrower. Includes the terms of the loan, as well as the current accounting state, such as interest owed.
 *  This contract purposefully has essentially no business logic. Really just setters and getters.
 * @author Goldfinch
 */

// solhint-disable-next-line max-states-count
contract CreditLine is BaseUpgradeablePausable {
  uint256 public constant SECONDS_PER_DAY = 60 * 60 * 24;

  // Credit line terms
  address public borrower;
  address public underwriter;
  uint256 public limit;
  uint256 public interestApr;
  uint256 public paymentPeriodInDays;
  uint256 public termInDays;
  uint256 public lateFeeApr;

  // Accounting variables
  uint256 public balance;
  uint256 public interestOwed;
  uint256 public principalOwed;
  uint256 public termEndTime;
  uint256 public nextDueTime;
  uint256 public interestAccruedAsOf;
  uint256 public writedownAmount;
  uint256 public lastFullPaymentTime;

  GoldfinchConfig public config;
  using ConfigHelper for GoldfinchConfig;

  function initialize(
    address _config,
    address owner,
    address _borrower,
    address _underwriter,
    uint256 _limit,
    uint256 _interestApr,
    uint256 _paymentPeriodInDays,
    uint256 _termInDays,
    uint256 _lateFeeApr
  ) public initializer {
    require(owner != address(0) && _borrower != address(0) && _underwriter != address(0), "Zero address passed in");
    __BaseUpgradeablePausable__init(owner);
    config = GoldfinchConfig(_config);
    borrower = _borrower;
    underwriter = _underwriter;
    limit = _limit;
    interestApr = _interestApr;
    paymentPeriodInDays = _paymentPeriodInDays;
    termInDays = _termInDays;
    lateFeeApr = _lateFeeApr;
    interestAccruedAsOf = block.timestamp;
  }

  function updateGoldfinchConfig() external onlyAdmin {
    config = GoldfinchConfig(config.configAddress());
  }

  function setTermEndTime(uint256 newTermEndTime) public onlyAdmin {
    termEndTime = newTermEndTime;
  }

  function setNextDueTime(uint256 newNextDueTime) public onlyAdmin {
    nextDueTime = newNextDueTime;
  }

  function setBalance(uint256 newBalance) public onlyAdmin {
    balance = newBalance;
  }

  function setInterestOwed(uint256 newInterestOwed) public onlyAdmin {
    interestOwed = newInterestOwed;
  }

  function setPrincipalOwed(uint256 newPrincipalOwed) public onlyAdmin {
    principalOwed = newPrincipalOwed;
  }

  function setInterestAccruedAsOf(uint256 newInterestAccruedAsOf) public onlyAdmin {
    interestAccruedAsOf = newInterestAccruedAsOf;
  }

  function setWritedownAmount(uint256 newWritedownAmount) external onlyAdmin {
    writedownAmount = newWritedownAmount;
  }

  function setLastFullPaymentTime(uint256 newLastFullPaymentTime) public onlyAdmin {
    lastFullPaymentTime = newLastFullPaymentTime;
  }

  function setLateFeeApr(uint256 newLateFeeApr) external onlyAdmin {
    lateFeeApr = newLateFeeApr;
  }

  function setLimit(uint256 newAmount) external onlyAdminOrUnderwriter {
    limit = newAmount;
  }

  // TODO: remove this
  function authorizePool(address configAddress) external onlyAdmin {
    GoldfinchConfig _config = GoldfinchConfig(configAddress);
    address poolAddress = _config.getAddress(uint256(ConfigOptions.Addresses.Pool));
    address usdcAddress = _config.getAddress(uint256(ConfigOptions.Addresses.USDC));
    // Approve the pool for an infinite amount
    bool success = IERC20withDec(usdcAddress).approve(poolAddress, uint256(-1));
    require(success, "Failed to approve USDC");
  }

  function assess()
    public
    onlyAdmin
    whenNotPaused
    returns (
      uint256,
      uint256,
      uint256
    )
  {
    // Do not assess until a full period has elapsed or past due
    require(balance > 0, "Must have balance to assess credit line");

    // Don't assess credit lines early!
    if (currentTime() < nextDueTime && !isLate(currentTime())) {
      return (0, 0, 0);
    }

    uint256 timeToAssess = calculateNextDueTime();
    setNextDueTime(timeToAssess);

    // We always want to assess for the most recently *past* nextDueTime.
    // So if the recalculation above sets the nextDueTime into the future,
    // then ensure we pass in the one just before this.
    if (timeToAssess > currentTime()) {
      uint256 secondsPerPeriod = paymentPeriodInDays.mul(SECONDS_PER_DAY);
      timeToAssess = timeToAssess.sub(secondsPerPeriod);
    }
    return handlePayment(getUSDCBalance(address(this)), timeToAssess);
  }

  function calculateNextDueTime() internal view returns (uint256) {
    uint256 newNextDueTime = nextDueTime;
    uint256 secondsPerPeriod = paymentPeriodInDays.mul(SECONDS_PER_DAY);
    uint256 curTimestamp = currentTime();
    // You must have just done your first drawdown
    if (newNextDueTime == 0 && balance > 0) {
      return curTimestamp.add(secondsPerPeriod);
    }

    // Active loan that has entered a new period, so return the *next* newNextDueTime.
    // But never return something after the termEndTime
    if (balance > 0 && curTimestamp >= newNextDueTime) {
      uint256 secondsToAdvance = (curTimestamp.sub(newNextDueTime).div(secondsPerPeriod)).add(1).mul(secondsPerPeriod);
      newNextDueTime = newNextDueTime.add(secondsToAdvance);
      return Math.min(newNextDueTime, termEndTime);
    }

    // Your paid off, or have not taken out a loan yet, so no next due time.
    if (balance == 0 && newNextDueTime != 0) {
      return 0;
    }
    // Active loan in current period, where we've already set the newNextDueTime correctly, so should not change.
    if (balance > 0 && curTimestamp < newNextDueTime) {
      return newNextDueTime;
    }
    revert("Error: could not calculate next due time.");
  }

  function currentTime() internal view virtual returns (uint256) {
    return block.timestamp;
  }

  function isLate(uint256 timestamp) internal view returns (bool) {
    uint256 secondsElapsedSinceFullPayment = timestamp.sub(lastFullPaymentTime);
    return secondsElapsedSinceFullPayment > paymentPeriodInDays.mul(SECONDS_PER_DAY);
  }

  /**
   * @notice Applies `amount` of payment for a given credit line. This moves already collected money into the Pool.
   *  It also updates all the accounting variables. Note that interest is always paid back first, then principal.
   *  Any extra after paying the minimum will go towards existing principal (reducing the
   *  effective interest rate). Any extra after the full loan has been paid off will remain in the
   *  USDC Balance of the creditLine, where it will be automatically used for the next drawdown.
   * @param paymentAmount The amount, in USDC atomic units, to be applied
   * @param timestamp The timestamp on which accrual calculations should be based. This allows us
   *  to be precise when we assess a Credit Line
   */
  function handlePayment(uint256 paymentAmount, uint256 timestamp)
    internal
    returns (
      uint256,
      uint256,
      uint256
    )
  {
    (uint256 newInterestOwed, uint256 newPrincipalOwed) = updateAndGetInterestAndPrincipalOwedAsOf(timestamp);
    Accountant.PaymentAllocation memory pa = Accountant.allocatePayment(
      paymentAmount,
      balance,
      newInterestOwed,
      newPrincipalOwed
    );

    uint256 newBalance = balance.sub(pa.principalPayment);
    // Apply any additional payment towards the balance
    newBalance = newBalance.sub(pa.additionalBalancePayment);
    uint256 totalPrincipalPayment = balance.sub(newBalance);
    uint256 paymentRemaining = paymentAmount.sub(pa.interestPayment).sub(totalPrincipalPayment);

    updateCreditLineAccounting(
      newBalance,
      newInterestOwed.sub(pa.interestPayment),
      newPrincipalOwed.sub(pa.principalPayment)
    );

    assert(paymentRemaining.add(pa.interestPayment).add(totalPrincipalPayment) == paymentAmount);

    return (paymentRemaining, pa.interestPayment, totalPrincipalPayment);
  }

  function updateAndGetInterestAndPrincipalOwedAsOf(uint256 timestamp) internal returns (uint256, uint256) {
    (uint256 interestAccrued, uint256 principalAccrued) = Accountant.calculateInterestAndPrincipalAccrued(
      this,
      timestamp,
      config.getLatenessGracePeriodInDays()
    );
    if (interestAccrued > 0) {
      // If we've accrued any interest, update interestAccruedAsOf to the time that we've
      // calculated interest for. If we've not accrued any interest, then we keep the old value so the next
      // time the entire period is taken into account.
      setInterestAccruedAsOf(timestamp);
    }
    return (interestOwed.add(interestAccrued), principalOwed.add(principalAccrued));
  }

  function updateCreditLineAccounting(
    uint256 newBalance,
    uint256 newInterestOwed,
    uint256 newPrincipalOwed
  ) internal nonReentrant {
    setBalance(newBalance);
    setInterestOwed(newInterestOwed);
    setPrincipalOwed(newPrincipalOwed);

    // This resets lastFullPaymentTime. These conditions assure that they have
    // indeed paid off all their interest and they have a real nextDueTime. (ie. creditline isn't pre-drawdown)
    if (newInterestOwed == 0 && nextDueTime != 0) {
      // If interest was fully paid off, then set the last full payment as the previous due time
      uint256 mostRecentLastDueTime;
      if (currentTime() < nextDueTime) {
        uint256 secondsPerPeriod = paymentPeriodInDays.mul(SECONDS_PER_DAY);
        mostRecentLastDueTime = nextDueTime.sub(secondsPerPeriod);
      } else {
        mostRecentLastDueTime = nextDueTime;
      }
      setLastFullPaymentTime(mostRecentLastDueTime);
    }

    setTermEndTime(calculateNewTermEndTime(newBalance)); // pass in balance as a gas optimization
    setNextDueTime(calculateNextDueTime());
  }

  function calculateNewTermEndTime(uint256 newBalance) internal view returns (uint256) {
    // If there's no balance, there's no loan, so there's no term end time
    if (newBalance == 0) {
      return 0;
    }
    // Don't allow any weird bugs where we add to your current end time. This
    // function should only be used on new credit lines, when we are setting them up
    if (termEndTime != 0) {
      return termEndTime;
    }
    return currentTime().add(SECONDS_PER_DAY.mul(termInDays));
  }

  function getUSDCBalance(address _address) internal view returns (uint256) {
    return config.getUSDC().balanceOf(_address);
  }

  modifier onlyAdminOrUnderwriter() {
    require(isAdmin() || _msgSender() == underwriter, "Restricted to owner or underwriter");
    _;
  }
}
