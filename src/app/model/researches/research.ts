import { IResearchData } from "../data/iResearchData";
import { Job } from "../job/job";
import { convertToRoman } from "ant-utils";
import { RESEARCH_GROW_RATE } from "../CONSTANTS";
import { IUnlocable } from "../iUnlocable";
import { Game } from "../game";

export class Research extends Job implements IUnlocable {
  id: string;
  name: string;
  private originalName: string;
  description: string;
  max = new Decimal(Number.MAX_SAFE_INTEGER);
  progress: Decimal;
  total: Decimal;
  level = 0;
  unitsToUnlock?: IUnlocable[];
  researchToUnlock?: IUnlocable[];

  constructor(researchData: IResearchData) {
    super();
    this.id = researchData.id;
    this.name = researchData.name;
    this.originalName = this.name;
    this.description = researchData.description;
    this.initialPrice = new Decimal(researchData.price);
    if ("max" in researchData) {
      this.max = new Decimal(researchData.max);
    }
    this.growRate = RESEARCH_GROW_RATE;
    if ("growRate" in researchData) {
      this.growRate = researchData.growRate;
    }
    if ("unitsToUnlock" in researchData) {
      this.unitsToUnlock = researchData.unitsToUnlock.map(uId =>
        Game.getGame().resouceManager.units.find(a => a.id === uId)
      );
    }
  }

  reload(): void {
    super.reload();
    this.name =
      this.originalName +
      (this.level > 1 ? " " + convertToRoman(this.level + 1) : "");
  }

  onCompleted(): void {
    super.onCompleted();

    if (this.level < 2) {
      if (this.unitsToUnlock) {
        this.unitsToUnlock.forEach(u => u.unlock());
        Game.getGame().resouceManager.reloadLists();
      }
      if (this.researchToUnlock) {
        this.researchToUnlock.forEach(u => u.unlock());
      }
    }
  }

  unlock(): boolean {
    const resM = Game.getGame().researchManager;
    return resM.unlock(this);
  }

  getSave(): any {
    const ret: any = {};
    ret.i = this.id;
    if (this.progress.gt(0)) {
      ret.p = this.progress;
    }
    if (this.level > 0) {
      ret.l = this.level;
    }
    return ret;
  }
  load(data: any) {
    if (!("i" in data) || data.i !== this.id) return false;
    if ("p" in data) this.progress = new Decimal(data.p);
    if ("l" in data) this.level = data.l;
    this.reload();
  }
}