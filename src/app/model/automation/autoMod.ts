import { AbstractAutobuyer } from "./abstractAutoBuyer";
import { Worker } from "../units/worker";
import { MAX_MOD_PRESET, ZERO, ONE } from "../CONSTANTS";
import { Game } from "../game";

export class AutoMod extends AbstractAutobuyer {
  minCompPercent = 0;
  constructor(public worker: Worker) {
    super();
    this.id = "/" + worker.id;
    worker.autoMod = this;
  }
  automate(): boolean {
    if (this.worker.modPage) return false;

    let toMod = false;

    for (let mod of this.worker.modStack.mods) {
      mod.uiQuantity = ZERO;
    }
    for (let i = 0; i < 7; i++) {
      let priSumPos = 0;
      let priSumNeg = 0;
      let positiveMods = this.worker.maxMods;

      //  Reload priorities
      for (let mod of this.worker.modStack.mods) {
        positiveMods = positiveMods.minus(mod.uiQuantity);
        if (mod.priority === 0) continue;
        if (mod.priority > 0) {
          if (
            mod.uiQuantity.lt(mod.max) &&
            mod.uiQuantity.lt(this.worker.maxMods)
          ) {
            priSumPos += mod.priority;
          }
        } else {
          if (
            mod.uiQuantity.gt(mod.min) &&
            mod.uiQuantity.gt(this.worker.maxMods.times(-1))
          ) {
            priSumNeg += mod.priority;
          }
        }
      }
      //  Positive mods
      if (priSumNeg < 0 && i === 0) {
        for (let mod of this.worker.modStack.mods) {
          if (mod.priority >= 0) continue;
          if (
            mod.uiQuantity.lte(mod.min) ||
            mod.uiQuantity.lte(this.worker.maxMods.times(-1))
          )
            continue;

          const modPerPriority = this.worker.maxMods.div(priSumPos);
          let toAdd = modPerPriority.times(mod.priority);
          toAdd = toAdd.max(mod.min.minus(mod.uiQuantity));
          toAdd = toAdd.max(
            this.worker.maxMods.times(-1).minus(mod.uiQuantity)
          );
          toAdd = toAdd.floor();
          if (toAdd.gte(0)) toAdd = ZERO;
          if (toAdd.lt(0)) {
            mod.uiQuantity = mod.uiQuantity.plus(toAdd);
            positiveMods = positiveMods.minus(toAdd);
          }
        }
      }
      //  Negative Mods
      if (priSumPos > 0) {
        for (let mod of this.worker.modStack.mods) {
          if (mod.priority <= 0) continue;
          if (
            mod.uiQuantity.gte(mod.max) ||
            mod.uiQuantity.gte(this.worker.maxMods)
          )
            continue;

          const modPerPriority = positiveMods.div(priSumPos);
          let toAdd = modPerPriority.times(mod.priority);
          toAdd = toAdd.min(mod.max.minus(mod.uiQuantity));
          toAdd = toAdd.min(this.worker.maxMods.minus(mod.uiQuantity));
          toAdd = toAdd.floor();
          if (toAdd.lte(0)) toAdd = ZERO;
          if (toAdd.gt(0)) {
            mod.uiQuantity = mod.uiQuantity.plus(toAdd);
          }
        }
      }
    }
    for (let mod of this.worker.modStack.mods) {
      if (!mod.quantity.eq(mod.uiQuantity)) {
        toMod = true;
        break;
      }
    }
    if (toMod) {
      this.worker.reloadComponentPrice();
      this.worker.reloadLimit();
      let recycle = this.worker.recycle.plus(Game.getGame().baseRecycling);
      recycle = recycle.min(this.worker.components.times(0.9));
      let componentGain = this.worker.quantity.times(recycle);
      let droneRestart = componentGain
        .div(this.worker.componentsTemp)
        .plus(1)
        .floor();
      droneRestart = droneRestart.min(this.worker.limitTemp.minus(ONE));
      componentGain = componentGain
        .minus(droneRestart.times(this.worker.componentsTemp))
        .max(0);
      const componentTotal = Game.getGame().resourceManager.components.quantity.plus(
        componentGain
      );
      const componentNeed = this.worker.limitTemp
        .minus(droneRestart)
        .times(this.worker.componentsTemp);
      const componentPercent = componentTotal
        .div(componentNeed)
        .times(100)
        .min(100)
        .floor()
        .toNumber();

      if (componentPercent >= this.minCompPercent) {
        for (let k = 0, n = this.worker.modStack.mods.length; k < n; k++) {
          this.worker.modStack.mods[k].quantity = this.worker.modStack.mods[
            k
          ].uiQuantity;
        }
        this.worker.confirmMods(true);
        return true;
      }
    }
    return false;
  }
  //#region Save and Load
  getSave(): any {
    const ret = super.getSave();
    ret.mCo = this.minCompPercent;
    return ret;
  }
  load(save: any): boolean {
    if (super.load(save)) {
      this.minCompPercent = save.mCo ?? 0;
      return true;
    }
  }
  //#endregion
}
