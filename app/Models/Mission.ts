import {
	BaseModel,
	beforeDelete,
	BelongsTo,
	belongsTo,
	column,
	computed,
	HasMany,
	hasMany,
} from '@ioc:Adonis/Lucid/Orm';
import User from 'App/Models/User';
import Worker from 'App/Models/Worker';
import { DateTime } from 'luxon';

export interface Destination {
	name: string;
	distance: number;
	population: number;
	minSkill: number;
}

export const DESTINATIONS: Record<string, Destination> = {
	'reykjavik': {
		name: 'Reykjavik',
		distance: 4,
		population: 0.01,
		minSkill: 1,
	},
	'oslo': {
		name: 'Oslo',
		distance: 12,
		population: 0.04,
		minSkill: 2,
	},
	'paris': {
		name: 'Paris',
		distance: 20,
		population: 0.1,
		minSkill: 3,
	},
	'vienna': {
		name: 'Vienna',
		distance: 35,
		population: 0.3,
		minSkill: 4,
	},
	'new york': {
		name: 'New York City',
		distance: 56,
		population: 0.6,
		minSkill: 6,
	},
	'whoville': {
		name: 'Whoville',
		distance: 70,
		population: 1,
		minSkill: 8,
	},
};

export default class Mission extends BaseModel {
	@column({ isPrimary: true })
	public id: number;

	@column()
	public type: 'pickup' | 'deliver';

	@column()
	public userId: number;

	@belongsTo(() => User)
	public user: BelongsTo<typeof User>;

	@column()
	public destinationId: string;

	@computed()
	public get destination(): Destination {
		return DESTINATIONS[this.destinationId];
	}

	@hasMany(() => Worker)
	public workers: HasMany<typeof Worker>;

	@column()
	public reward: number = 0;

	@column.dateTime()
	public started: DateTime | null = null;

	@computed()
	public get endTime(): DateTime | null {
		if (this.started == null) {
			return null;
		}

		return this.started.plus({ minutes: this.destination.distance });
	}

	public get isFinished(): boolean {
		if (this.endTime == null) {
			return false;
		}

		return this.endTime.diffNow('milliseconds').milliseconds <= 0;
	}

	@beforeDelete()
	public static async removeWorkers(mission: Mission) {
		for (let worker of mission.workers) {
			worker.missionId = null;
		}
		await Promise.all(mission.workers.map(w => w.save()));
	}
}
