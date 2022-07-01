/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import BN from "bn.js"
import {ContractOptions} from "web3-eth-contract"
import {EventLog} from "web3-core"
import {EventEmitter} from "events"
import {
  Callback,
  PayableTransactionObject,
  NonPayableTransactionObject,
  BlockType,
  ContractEventLog,
  BaseContract,
} from "@goldfinch-eng/protocol/typechain/web3/types"

interface EventOptions {
  filter?: object
  fromBlock?: BlockType
  topics?: string[]
}

export type CreditLineCreated = ContractEventLog<{
  borrower: string
  creditLine: string
  0: string
  1: string
}>
export type DrawdownMade = ContractEventLog<{
  borrower: string
  creditLine: string
  drawdownAmount: string
  0: string
  1: string
  2: string
}>
export type GovernanceUpdatedUnderwriterLimit = ContractEventLog<{
  underwriter: string
  newLimit: string
  0: string
  1: string
}>
export type Paused = ContractEventLog<{
  account: string
  0: string
}>
export type PaymentApplied = ContractEventLog<{
  payer: string
  creditLine: string
  interestAmount: string
  principalAmount: string
  remainingAmount: string
  0: string
  1: string
  2: string
  3: string
  4: string
}>
export type PaymentCollected = ContractEventLog<{
  payer: string
  creditLine: string
  paymentAmount: string
  0: string
  1: string
  2: string
}>
export type RoleGranted = ContractEventLog<{
  role: string
  account: string
  sender: string
  0: string
  1: string
  2: string
}>
export type RoleRevoked = ContractEventLog<{
  role: string
  account: string
  sender: string
  0: string
  1: string
  2: string
}>
export type Unpaused = ContractEventLog<{
  account: string
  0: string
}>

export interface CreditDesk extends BaseContract {
  constructor(jsonInterface: any[], address?: string, options?: ContractOptions): CreditDesk
  clone(): CreditDesk
  methods: {
    DEFAULT_ADMIN_ROLE(): NonPayableTransactionObject<string>

    OWNER_ROLE(): NonPayableTransactionObject<string>

    PAUSER_ROLE(): NonPayableTransactionObject<string>

    SECONDS_PER_DAY(): NonPayableTransactionObject<string>

    __BaseUpgradeablePausable__init(owner: string): NonPayableTransactionObject<void>

    __PauserPausable__init(): NonPayableTransactionObject<void>

    applyPayment(creditLineAddress: string, amount: number | string | BN): NonPayableTransactionObject<void>

    assessCreditLine(creditLineAddress: string): NonPayableTransactionObject<void>

    config(): NonPayableTransactionObject<string>

    drawdown(creditLineAddress: string, amount: number | string | BN): NonPayableTransactionObject<void>

    getBorrowerCreditLines(borrowerAddress: string): NonPayableTransactionObject<string[]>

    getNextPaymentAmount(creditLineAddress: string, asOf: number | string | BN): NonPayableTransactionObject<string>

    getRoleAdmin(role: string | number[]): NonPayableTransactionObject<string>

    getRoleMember(role: string | number[], index: number | string | BN): NonPayableTransactionObject<string>

    getRoleMemberCount(role: string | number[]): NonPayableTransactionObject<string>

    getUnderwriterCreditLines(underwriterAddress: string): NonPayableTransactionObject<string[]>

    grantRole(role: string | number[], account: string): NonPayableTransactionObject<void>

    hasRole(role: string | number[], account: string): NonPayableTransactionObject<boolean>

    initialize(owner: string, _config: string): NonPayableTransactionObject<void>

    isAdmin(): NonPayableTransactionObject<boolean>

    migrateV1CreditLine(
      _clToMigrate: string,
      borrower: string,
      termEndTime: number | string | BN,
      nextDueTime: number | string | BN,
      interestAccruedAsOf: number | string | BN,
      lastFullPaymentTime: number | string | BN,
      totalInterestPaid: number | string | BN
    ): NonPayableTransactionObject<{
      0: string
      1: string
    }>

    pause(): NonPayableTransactionObject<void>

    paused(): NonPayableTransactionObject<boolean>

    pay(creditLineAddress: string, amount: number | string | BN): NonPayableTransactionObject<void>

    renounceRole(role: string | number[], account: string): NonPayableTransactionObject<void>

    revokeRole(role: string | number[], account: string): NonPayableTransactionObject<void>

    setUnderwriterGovernanceLimit(
      underwriterAddress: string,
      limit: number | string | BN
    ): NonPayableTransactionObject<void>

    totalLoansOutstanding(): NonPayableTransactionObject<string>

    totalWritedowns(): NonPayableTransactionObject<string>

    underwriters(arg0: string): NonPayableTransactionObject<string>

    unpause(): NonPayableTransactionObject<void>
  }
  events: {
    CreditLineCreated(cb?: Callback<CreditLineCreated>): EventEmitter
    CreditLineCreated(options?: EventOptions, cb?: Callback<CreditLineCreated>): EventEmitter

    DrawdownMade(cb?: Callback<DrawdownMade>): EventEmitter
    DrawdownMade(options?: EventOptions, cb?: Callback<DrawdownMade>): EventEmitter

    GovernanceUpdatedUnderwriterLimit(cb?: Callback<GovernanceUpdatedUnderwriterLimit>): EventEmitter
    GovernanceUpdatedUnderwriterLimit(
      options?: EventOptions,
      cb?: Callback<GovernanceUpdatedUnderwriterLimit>
    ): EventEmitter

    Paused(cb?: Callback<Paused>): EventEmitter
    Paused(options?: EventOptions, cb?: Callback<Paused>): EventEmitter

    PaymentApplied(cb?: Callback<PaymentApplied>): EventEmitter
    PaymentApplied(options?: EventOptions, cb?: Callback<PaymentApplied>): EventEmitter

    PaymentCollected(cb?: Callback<PaymentCollected>): EventEmitter
    PaymentCollected(options?: EventOptions, cb?: Callback<PaymentCollected>): EventEmitter

    RoleGranted(cb?: Callback<RoleGranted>): EventEmitter
    RoleGranted(options?: EventOptions, cb?: Callback<RoleGranted>): EventEmitter

    RoleRevoked(cb?: Callback<RoleRevoked>): EventEmitter
    RoleRevoked(options?: EventOptions, cb?: Callback<RoleRevoked>): EventEmitter

    Unpaused(cb?: Callback<Unpaused>): EventEmitter
    Unpaused(options?: EventOptions, cb?: Callback<Unpaused>): EventEmitter

    allEvents(options?: EventOptions, cb?: Callback<EventLog>): EventEmitter
  }

  once(event: "CreditLineCreated", cb: Callback<CreditLineCreated>): void
  once(event: "CreditLineCreated", options: EventOptions, cb: Callback<CreditLineCreated>): void

  once(event: "DrawdownMade", cb: Callback<DrawdownMade>): void
  once(event: "DrawdownMade", options: EventOptions, cb: Callback<DrawdownMade>): void

  once(event: "GovernanceUpdatedUnderwriterLimit", cb: Callback<GovernanceUpdatedUnderwriterLimit>): void
  once(
    event: "GovernanceUpdatedUnderwriterLimit",
    options: EventOptions,
    cb: Callback<GovernanceUpdatedUnderwriterLimit>
  ): void

  once(event: "Paused", cb: Callback<Paused>): void
  once(event: "Paused", options: EventOptions, cb: Callback<Paused>): void

  once(event: "PaymentApplied", cb: Callback<PaymentApplied>): void
  once(event: "PaymentApplied", options: EventOptions, cb: Callback<PaymentApplied>): void

  once(event: "PaymentCollected", cb: Callback<PaymentCollected>): void
  once(event: "PaymentCollected", options: EventOptions, cb: Callback<PaymentCollected>): void

  once(event: "RoleGranted", cb: Callback<RoleGranted>): void
  once(event: "RoleGranted", options: EventOptions, cb: Callback<RoleGranted>): void

  once(event: "RoleRevoked", cb: Callback<RoleRevoked>): void
  once(event: "RoleRevoked", options: EventOptions, cb: Callback<RoleRevoked>): void

  once(event: "Unpaused", cb: Callback<Unpaused>): void
  once(event: "Unpaused", options: EventOptions, cb: Callback<Unpaused>): void
}
