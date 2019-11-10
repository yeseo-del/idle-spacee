import { Price } from "./price";
import { ZERO } from "../CONSTANTS";

export class MultiPrice {
  canBuy = false;
  maxBuy = ZERO;
  private _oldMaxBuy = ZERO;
  halfBuy = ZERO;

  canBuyWanted = false;
  availableIn = Number.POSITIVE_INFINITY;

  constructor(public prices: Price[] = []) {}
  reload(bought: Decimal, numWanted = new Decimal(1)) {
    this.canBuy = true;
    this.canBuyWanted = true;
    numWanted = new Decimal(numWanted).max(1);
    this.prices.forEach(pr => {
      pr.reload(bought, numWanted);
      if (!pr.canBuy) this.canBuy = false;
      if (!pr.canBuyMulti) this.canBuyWanted = false;
    });
    this.maxBuy = this.canBuy
      ? this.prices
          .map(p => p.maxBuy)
          .reduce((p, c) => p.min(c), new Decimal(Number.POSITIVE_INFINITY))
      : ZERO;

    if (this._oldMaxBuy.eq(this.maxBuy)) {
      this.maxBuy = this._oldMaxBuy;
    } else {
      this._oldMaxBuy = this.maxBuy;
      this.halfBuy = this.maxBuy.div(2).floor();
    }

    // this.reloadAvailableTime();
  }
  buy(quantity: Decimal, bought: Decimal): boolean {
    this.reload(bought, quantity);
    if (!this.canBuy) return false;
    this.prices.forEach(pr => pr.buy(quantity, bought));
    this.reload(bought.plus(quantity), quantity);
    return true;
  }
  // reloadAvailableTime() {
  //   this.availableIn =
  //     this.prices
  //       .map(p => p.getTime())
  //       .reduce((p, c) => p.max(c), ZERO)
  //       .toNumber() * 1000;
  // }
  getMaxBuy(bought: Decimal, percentToUse: number): Decimal {
    return this.prices
      .map(pr => pr.getMaxBuy(bought, percentToUse))
      .reduce((p, c) => p.min(c), new Decimal(Number.POSITIVE_INFINITY));
  }
}