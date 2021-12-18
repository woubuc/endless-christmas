import { BaseModel, belongsTo, BelongsTo, column } from '@ioc:Adonis/Lucid/Orm';
import User from 'App/Models/User';

export default class SellOrder extends BaseModel {
	@column({ isPrimary: true })
	public id: number;

	@column()
	public userId: number | null = null;

	@belongsTo(() => User)
	public user: BelongsTo<typeof User>;

	@column()
	public item: string;

	@column()
	public amount: number;

	@column()
	public price: number;
}
