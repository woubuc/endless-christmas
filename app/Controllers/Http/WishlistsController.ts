import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database';
import Mission from 'App/Models/Mission';

export default class WishlistsController {

	public async show({ auth, view, request }: HttpContextContract) {
		let user = auth.user!;

		let id = parseInt(request.param('id'), 10);
		let wishlist = user.wishlists.find(w => w.id === id);
		if (wishlist == undefined) {
			throw new ReferenceError('Invalid ID');
		}

		return view.render('game/wishlist', { wishlist });
	}

	public async deliver({ auth, request, response }: HttpContextContract) {
		let user = auth.user!;

		let id = parseInt(request.param('id'), 10);
		let wishlist = user.wishlists.find(w => w.id === id);
		if (wishlist == undefined) {
			return response.redirect('/game');
		}

		if (wishlist.completeness < 1) {
			return response.redirect(`/game/wishlists/${ id }`);
		}

		for (let [key, amount] of Object.entries(wishlist.items)) {
			user.inventory[key] -= amount;
		}

		let mission = new Mission();
		mission.type = 'deliver';
		mission.userId = user.id;
		mission.destinationId = wishlist.destinationId;
		mission.reward = Math.ceil(wishlist.totalCount * 2);

		return Database.transaction(async tx => {
			await user.useTransaction(tx).save();
			await mission.useTransaction(tx).save();
			await wishlist!.useTransaction(tx).delete();

			return response.redirect(`/game/missions/${ mission.id }`);
		});
	}

}
