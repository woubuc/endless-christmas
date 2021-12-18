import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import User from 'App/Models/User';
import AuthLoginValidator from 'App/Validators/AuthLoginValidator';
import AuthRegisterValidator from 'App/Validators/AuthRegisterValidator';

export default class AuthController {

	public async showLogin({ auth, view, response }: HttpContextContract) {
		if (auth.isAuthenticated) {
			return response.redirect('/game');
		}

		return view.render('login');
	}

	public async login({ request, response, auth }: HttpContextContract) {
		let body = await request.validate(AuthLoginValidator);
		await auth.attempt(body.email, body.password, body.remember);
		return response.redirect('/game');
	}

	public async logout({ auth, response }: HttpContextContract) {
		await auth.logout();
		return response.redirect('/');
	}

	public async showRegister({ view, auth, response }: HttpContextContract) {
		if (auth.isAuthenticated) {
			return response.redirect('/game');
		}
		return view.render('register');
	}

	public async register({ request, response, auth }: HttpContextContract) {
		let body = await request.validate(AuthRegisterValidator);

		let user = new User();
		user.email = body.email;
		user.password = body.password;
		await user.save();

		await auth.login(user);
		return response.redirect('/game');
	}

}
