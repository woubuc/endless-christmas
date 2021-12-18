import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { rules, schema } from '@ioc:Adonis/Core/Validator';

export default class AuthRegisterValidator {
	constructor(protected ctx: HttpContextContract) {}

	public schema = schema.create({
		email: schema.string({ trim: true }, [
			rules.email(),
			rules.unique({ table: 'users', column: 'email' }),
		]),
		password: schema.string({ trim: true }, [
			rules.minLength(12),
			rules.confirmed(),
		]),
	});

	public messages = {
		required: 'Field cannot be empty',
		'email.unique': 'This email address is already in use',
		'password.minLength': 'Please choose a password of at least {{ options.minLength }} characters',
		'password.confirmed': 'Passwords do not match',
	};
}
