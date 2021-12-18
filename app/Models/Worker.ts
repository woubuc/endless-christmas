import { afterFetch, BaseModel, belongsTo, BelongsTo, column, computed } from '@ioc:Adonis/Lucid/Orm';
import Building from 'App/Models/Building';
import Mission from 'App/Models/Mission';
import User from 'App/Models/User';
import { getName } from 'App/Utils/Name';
import gaussian from 'gaussian';
import { DateTime } from 'luxon';

const distribution = gaussian(5, 5);

function randomSkill(): number {
	let random = Math.ceil(distribution.ppf(Math.random()));

	if (random < 1) {
		return 1;
	}
	if (random > 10) {
		return 10;
	}

	return random;
}

export default class Worker extends BaseModel {
	public static generate(userId: number): Worker {
		let worker = new Worker();
		worker.userId = userId;
		worker.name = getName();
		worker.hired = false;

		worker.skillStrength = randomSkill();
		worker.skillStealth = randomSkill();
		worker.skillCrafting = randomSkill();

		let wage = (worker.skillStrength + worker.skillStealth + worker.skillCrafting) * 1.25;
		wage += Math.random() * (wage * 0.25);
		worker.wage = Math.round(wage);

		worker.updated = DateTime.now();
		return worker;
	}

	@column({ isPrimary: true })
	public id: number;

	@column()
	public userId: number;

	@belongsTo(() => User)
	public user: BelongsTo<typeof User>;

	@column()
	public name: string;

	@column()
	public hired: boolean = false;

	@column()
	public buildingId: number | null = null;

	@belongsTo(() => Building)
	public building: BelongsTo<typeof Building>;

	@column()
	public missionId: number | null = null;

	@belongsTo(() => Mission)
	public mission: BelongsTo<typeof Mission>;

	@computed()
	public get isWorking(): boolean {
		return this.buildingId != null || this.missionId != null;
	}

	@column()
	public skillStrength: number;

	@column()
	public skillStealth: number;

	@column()
	public skillCrafting: number;

	@column()
	public wage: number;

	@column.dateTime({ autoCreate: true })
	public updated: DateTime;

	@afterFetch()
	public static async deleteExpiredCandidates(workers: Worker[]): Promise<Worker[]> {
		// Delete all workers who are not hired and who have been available for more than 1 hour
		await Promise.all(workers
			.filter(w => !w.hired)
			.filter(w => w.updated.diffNow('hours').hours > 1)
			.map(w => w.delete()),
		);

		return workers.filter(w => !w.$isDeleted);
	}
}
