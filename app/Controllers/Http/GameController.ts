import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import GameChooseNameValidator from 'App/Validators/GameChooseNameValidator';

export default class GameController {

	public async overview({ auth, view, response }: HttpContextContract) {
		let user = auth.user!;

		if (user.name == null) {
			return view.render('game/choose-name');
		}

		if (user.needsTutorial('hire_elves')) {
			return response.redirect('/game/workers');
		}

		return view.render('game/overview');
	}

	public async chooseName({ auth, request, response }: HttpContextContract) {
		let user = auth.user!;

		let { name } = await request.validate(GameChooseNameValidator);
		user.name = name;
		await user.save();

		return response.redirect('/game');
	}
}
