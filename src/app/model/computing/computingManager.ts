import { BonusStack } from "../bonus/bonusStack";
import { Spell } from "./spell";
import { BASE_COMPUTING, COMPUTING_TECH_BONUS } from "../CONSTANTS";
import { WarpSpell } from "./warp";
import { Research } from "../researches/research";
import { ResearchSpell } from "./researchSpell";
import { BuilderSpell } from "./builderSpell";
import { WarSpell } from "./warSpell";
import { DroneSpell } from "./droneSpell";
import { Bonus } from "../bonus/bonus";
import { Game } from "../game";

export class ComputingManager {
  currentComputing: number = 0;
  computingPerSec: number = 0;
  maxComputing: number = BASE_COMPUTING;
  computingStack = new BonusStack();
  computingStackMulti = new BonusStack();
  maxComputingStack = new BonusStack();
  spells = new Array<Spell>();
  currentSpells = new Array<Spell>();
  computingPercent = 100;
  constructor() {
    const warpSpell = new WarpSpell();
    const researchSpell = new ResearchSpell();
    const builderSpell = new BuilderSpell();
    const warSpell = new WarSpell();
    const droneSpell = new DroneSpell();
    this.spells = [
      warpSpell,
      researchSpell,
      builderSpell,
      warSpell,
      droneSpell
    ];
    this.currentSpells = [warpSpell];

    this.computingStackMulti.bonuses.push(
      new Bonus(
        Game.getGame().researchManager.computingTech,
        new Decimal(COMPUTING_TECH_BONUS)
      )
    );
    const rm = Game.getGame().researchManager;
    rm.researches.forEach((res) => {
      if (res.computingPerSec > 0) {
        this.computingStack.bonuses.push(
          new Bonus(res, new Decimal(res.computingPerSec))
        );
      }
    });
  }
  update(delta: number) {
    this.maxComputingStack.reloadAdditiveBonus();
    this.maxComputing =
      BASE_COMPUTING + this.maxComputingStack.totalAdditiveBonus.toNumber();

    this.computingStack.reloadAdditiveBonus();
    this.computingStackMulti.reloadBonus();
    this.computingPerSec =
      10 + this.computingStack.totalAdditiveBonus.toNumber();
    this.computingPerSec *= this.computingStackMulti.totalBonus.toNumber();

    this.currentComputing += delta * this.computingPerSec;
    this.currentComputing = Math.min(this.currentComputing, this.maxComputing);
    this.computingPercent = Math.floor(
      (100 * this.currentComputing) / this.maxComputing
    );

    const now = Date.now();
    for (let i = 0, n = this.currentSpells.length; i < n; i++) {
      if (this.currentSpells[i].endTime < now)
        this.currentSpells[i].active = false;

      if (this.currentSpells[i].active) {
        this.currentSpells[i].percent = Math.floor(
          100 -
            (100 * (this.currentSpells[i].endTime - now)) /
              this.currentSpells[i].duration
        );
      } else {
        this.currentSpells[i].percent = 100;
      }

      this.currentSpells[i].canAfford =
        !this.currentSpells[i].active &&
        this.currentSpells[i].price <= this.currentComputing;
    }
  }
  addSpell(spell: Spell) {
    if (this.currentSpells.findIndex((s) => s.id === spell.id) > -1)
      return false;
    this.currentSpells.push(spell);
  }

  //#region Save and Load
  getSave(): any {
    return {
      c: this.currentComputing,
      s: this.currentSpells.map((sp) => sp.id)
    };
  }
  load(data: any) {
    if ("c" in data) this.currentComputing = data.c;
    if ("s" in data) {
      for (let i = 0, n = data.s.length; i < n; i++) {
        const spell = this.spells.find((sp) => sp.id === data.s[i]);
        if (spell && this.currentSpells.findIndex((s) => s === spell) < 0) {
          this.currentSpells.push(spell);
        }
      }
    }
  }
  //#endregion
}