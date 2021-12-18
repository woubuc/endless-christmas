import Hash from '@ioc:Adonis/Core/Hash';
import Database from '@ioc:Adonis/Lucid/Database';
import {
	afterFind,
	BaseModel,
	beforeFind,
	beforeSave,
	column,
	computed,
	HasMany,
	hasMany,
	ModelQueryBuilderContract,
} from '@ioc:Adonis/Lucid/Orm';
import Building from 'App/Models/Building';
import Mission from 'App/Models/Mission';
import Wishlist from 'App/Models/Wishlist';
import Worker from 'App/Models/Worker';
import { DateTime } from 'luxon';

export default class User extends BaseModel {
	@column({ isPrimary: true })
	public id: number;

	@column()
	public email: string;

	@column({ serializeAs: null })
	public password: string;

	@column()
	public rememberMeToken?: string;

	@column.dateTime({ autoCreate: true })
	public updated: DateTime;

	@hasMany(() => Building)
	public buildings: HasMany<typeof Building>;

	@hasMany(() => Worker)
	public workers: HasMany<typeof Worker>;

	@hasMany(() => Mission)
	public missions: HasMany<typeof Mission>;

	@computed()
	public get activeMissions(): Mission[] {
		return this.missions.filter(m => m.started != null);
	}

	@hasMany(() => Wishlist)
	public wishlists: HasMany<typeof Wishlist>;

	@column()
	public name: string | null = null;

	@column()
	public inventory: Record<string, number> = {};

	@column()
	public money: number = 250;

	@column()
	public tutorial: Record<string, boolean> = {};
	private justCompletedTutorials = new Set<string>();

	public needsTutorial(key: string): boolean {
		return this.tutorial[key] == undefined || !this.tutorial[key];
	}

	public justCompletedTutorial(key: string): boolean {
		return this.justCompletedTutorials.has(key);
	}

	public completeTutorial(key: string): void {
		this.tutorial[key] = true;
		this.justCompletedTutorials.add(key);
	}


	@computed()
	public get freeWorkerCount(): number {
		return this.workers
			.filter(w => w.hired && w.buildingId == null && w.missionId == null)
			.length;
	}

	@computed()
	public get hiredWorkerCount(): number {
		return this.workers.filter(w => w.hired).length;
	}

	@computed()
	public get pendingMissionCount(): number {
		return this.missions
			.filter(m => m.started == null)
			.length;
	}

	public canGoTo(destinationId: string): boolean {
		return this.wishlists.find(l => l.destinationId === destinationId) == undefined
			&& this.missions.find(m => m.destinationId === destinationId) == undefined;
	}

	@beforeSave()
	public static async hashPassword(user: User) {
		if (user.$dirty.password) {
			user.password = await Hash.make(user.password);
		}
	}

	@beforeFind()
	public static async alwaysPreload(query: ModelQueryBuilderContract<typeof User>) {
		query.preload('buildings', b => b.preload('workers'));
		query.preload('missions', m => m.preload('workers'));
		query.preload('workers');
		query.preload('wishlists');
	}

	@afterFind()
	public static async updateInventory(user: User) {
		let now = DateTime.now().startOf('minute');
		let minutesSinceLastUpdate = now.diff(user.updated, 'minutes').minutes;

		if (minutesSinceLastUpdate >= 1) {
			await Database.transaction(async tx => {
				for (let building of user.buildings) {
					for (let [item, amount] of Object.entries(building.production)) {
						if (user.inventory[item] == undefined) {
							user.inventory[item] = 0;
						}
						user.inventory[item] += amount * building.workers.length;
					}
				}

				for (let mission of user.missions) {
					if (mission.isFinished) {
						if (user.needsTutorial('mission')) {
							user.completeTutorial('mission');
						}
						if (mission.type === 'pickup') {
							let wishlist = await Wishlist.generate(mission.userId, mission.destinationId, mission.destination.population);
							user.missions.splice(user.missions.indexOf(mission), 1);
							user.wishlists.push(wishlist);
						} else {
							user.money += mission.reward;
						}
						await mission.useTransaction(tx).delete();
					}
				}

				for (let worker of user.workers) {
					if (!worker.hired && -worker.updated.diffNow('hours').hours >= 1) {
						await worker.useTransaction(tx).delete();
						user.workers.splice(user.workers.indexOf(worker), 1);
					}

					if (worker.hired && -worker.updated.diffNow('days').days >= 1) {
						user.money -= worker.wage;
						worker.updated = now;
						await worker.useTransaction(tx).save();
					}
				}

				user.updated = now;
				await user.useTransaction(tx).save();
			});
		}
	}
}
