import { BaseModel, BelongsTo, belongsTo, column, computed, HasMany, hasMany } from '@ioc:Adonis/Lucid/Orm';
import User from 'App/Models/User';
import Worker from 'App/Models/Worker';

export default class Building extends BaseModel {
	@column({ isPrimary: true })
	public id: number;

	@column()
	public userId: number;

	@belongsTo(() => User)
	public user: BelongsTo<typeof User>;

	@column()
	public type: string;

	@hasMany(() => Worker)
	public workers: HasMany<typeof Worker>;

	@computed()
	public get production(): Record<string, number> {
		let production = Math.ceil(this.workers.reduce((acc, w) => acc + (w.skillCrafting / 3), 0));

		switch (this.type) {
			case 'books':
				return { books: 4 * production };
			case 'construction':
				return { construction: 2 * production };
			case 'decor':
				return { decor: 3 * production };
			case 'electronics':
				return { electronics: 1 * production };
			case 'games':
				return { games: 2 * production };
			case 'music':
				return { music: 1 * production };
			case 'plushies':
				return { plushies: 4 * production };
			case 'toys':
				return { toys: 3 * production };
			default:
				return {};
		}
	}
}
