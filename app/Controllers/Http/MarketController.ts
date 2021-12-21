import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import Database from '@ioc:Adonis/Lucid/Database';

import SellOrder from 'App/Models/SellOrder';
import User from 'App/Models/User';
import MarketBuyValidator from 'App/Validators/MarketBuyValidator';
import MarketSellValidator from 'App/Validators/MarketSellValidator';

export default class MarketController {

	public async index({ view, i18n }: HttpContextContract) {
		let sellOrders = await SellOrder.all();

		let newOrders: SellOrder[] = [];
		for (let item of ['games', 'books', 'construction', 'decor', 'electronics', 'music', 'plushies', 'toys']) {
			let hasSellOrder = sellOrders.find(s => s.item === item) != undefined;
			if (!hasSellOrder) {
				console.log('no sell order for', item);
				let order = new SellOrder();
				order.item = item;
				order.amount = Math.round(10 + (Math.random() * 100));
				order.price = Math.round(3 + (Math.random() * 7));
				newOrders.push(order);
			}
		}
		await Promise.all(newOrders.map(o => o.save()));
		sellOrders.push(...newOrders);

		sellOrders.sort((a, b) => {
			if (a.item === b.item) {
				return a.price - b.price;
			}
			return i18n.formatMessage(`items.${ a.item }`).localeCompare(i18n.formatMessage(`items.${ b.item }`));
		});

		return view.render('game/market/index', { sellOrders });
	}

	public async showSell({ auth, view, request, response }: HttpContextContract) {
		let user = auth.user!;

		let item = request.param('item');
		let max = user.inventory[item] ?? 0;

		if (max <= 0) {
			return response.redirect('/game/market');
		}

		return view.render('game/market/sell', { item, max });
	}

	public async sell({ auth, request, response }: HttpContextContract) {
		let user = auth.user!;

		let body = await request.validate(MarketSellValidator);

		if (user.inventory[body.item] < body.amount) {
			throw new Error(`Not enough ${ body.item } in inventory`);
		}

		if (user.money < 2) {
			throw new Error('Not enough money to pay market fee');
		}

		user.inventory[body.item] -= body.amount;
		user.money -= 2;

		let sellOrder = new SellOrder();
		sellOrder.userId = user.id;
		sellOrder.item = body.item;
		sellOrder.amount = body.amount;
		sellOrder.price = body.price;

		await Database.transaction(async tx => {
			await user.useTransaction(tx).save();
			await sellOrder.useTransaction(tx).save();
		});

		return response.redirect('/game/market');
	}

	public async buy({ auth, request, response }: HttpContextContract) {
		let user = auth.user!;

		let body = await request.validate(MarketBuyValidator);

		let id = request.param('id');
		let order = await SellOrder.findOrFail(id);

		let totalCost = body.amount * order.price;
		if (user.money < totalCost) {
			throw new Error('Not enough money');
		}

		if (body.amount > order.amount) {
			throw new RangeError('Requested amount exceeds order amount');
		}

		await Database.transaction(async tx => {
			user.money -= totalCost;
			if (user.inventory[order.item] == undefined) {
				user.inventory[order.item] = 0;
			}
			user.inventory[order.item] += body.amount;
			await user.useTransaction(tx).save();

			if (order.userId != null) {
				let otherUser = await User.query()
					.useTransaction(tx)
					.where({ id: order.userId })
					.firstOrFail();
				otherUser.money += totalCost;
				await otherUser.useTransaction(tx).save();
			}

			order.amount -= body.amount;
			if (order.amount <= 0) {
				await order.useTransaction(tx).delete();
			} else {
				await order.useTransaction(tx).save();
			}
		});

		return response.redirect('/game/market');
	}

	public async withdraw({ auth, request, response }: HttpContextContract) {
		let user = auth.user!;

		let id = request.param('id');
		let order = await SellOrder.query()
			.where({
				id,
				userId: user.id,
			})
			.firstOrFail();

		if (user.inventory[order.item] == undefined) {
			user.inventory[order.item] = 0;
		}
		user.inventory[order.item] += order.amount;

		await Database.transaction(async tx => {
			await user.useTransaction(tx).save();
			await order.useTransaction(tx).delete();
		});

		return response.redirect('/game/market');
	}
}
