import HttpContext from '@ioc:Adonis/Core/HttpContext';
import { BaseModel, BelongsTo, belongsTo, column, computed } from '@ioc:Adonis/Lucid/Orm';
import { Destination, DESTINATIONS } from 'App/Models/Mission';
import User from 'App/Models/User';

function randomAmount(multiplier: number): number {
	let random = ((Math.random() * 1000) - 10) * multiplier;

	if (random < 4) {
		random = 0;
	}

	return Math.ceil(random);
}

export default class Wishlist extends BaseModel {
	public static async generate(userId: number, destinationId: string, multiplier: number): Promise<Wishlist> {
		let wishlist = new Wishlist();
		wishlist.userId = userId;
		wishlist.destinationId = destinationId;
		wishlist.items = {
			games: randomAmount(multiplier),
			books: randomAmount(multiplier),
			construction: randomAmount(multiplier),
			decor: randomAmount(multiplier),
			electronics: randomAmount(multiplier),
			music: randomAmount(multiplier),
			plushies: randomAmount(multiplier),
			toys: randomAmount(multiplier),
		};

		await wishlist.save();
		return wishlist;
	}

	@column({ isPrimary: true })
	public id: number;

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

	@column()
	public items: Record<string, number>;

	@computed()
	public get totalCount(): number {
		let total = 0;
		for (let amountNeeded of Object.values(this.items)) {
			total += amountNeeded;
		}
		return total;
	}

	@computed()
	public get completeness(): number {
		let ctx = HttpContext.get();
		if (ctx == null || ctx.auth.user == undefined) {
			return 0;
		}

		let total = 0;
		let available = 0;
		for (let [key, amountNeeded] of Object.entries(this.items)) {
			total += amountNeeded;
			let inInventory = ctx.auth.user.inventory[key] ?? 0;
			if (inInventory > amountNeeded) {
				available += amountNeeded;
			} else {
				available += inInventory;
			}
		}

		return Math.floor(available / total * 100) / 100;
	}
}
