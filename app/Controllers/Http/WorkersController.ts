import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database';
import Worker from 'App/Models/Worker';

export default class WorkersController {

	public async index({ auth, view }: HttpContextContract) {
		let workers = auth.user!.workers
			.filter(w => w.hired)
			.sort((a, b) => {
				if (!a.isWorking && b.isWorking) {
					return -1;
				}

				if (a.isWorking && !b.isWorking) {
					return 1;
				}

				if (b.wage == a.wage) {
					return a.name.localeCompare(b.name);
				}

				return b.wage - a.wage;
			});
		return view.render('game/workers/index', { workers });
	}

	public async showHire({ auth, view }: HttpContextContract) {
		let workers = auth.user!.workers.filter(w => !w.hired);
		return view.render('game/workers/hire', { workers });
	}

	public async hire({ auth, request, response }: HttpContextContract) {
		let user = auth.user!;
		let id = request.param('id');

		let worker = await Worker.query()
			.where({
				id,
				userId: user.id,
				hired: false,
			})
			.firstOrFail();

		if (user.money < worker.wage) {
			throw new Error('Not enough money');
		}

		await Database.transaction(async tx => {
			user.money -= worker.wage;
			await user.useTransaction(tx).save();

			worker.hired = true;
			await worker.useTransaction(tx).save();
		});

		return response.redirect('/game/workers/hire');
	}

	public async recruit({ auth, response }: HttpContextContract) {
		let user = auth.user!;

		if (user.money <= 1) {
			throw new RangeError('Not enough money');
		}

		let amountToGenerate = Math.floor(4 + (Math.random() * 8));
		let workers: Worker[] = [];
		for (let i = 0; i < amountToGenerate; i++) {
			workers.push(Worker.generate(user.id));
		}

		await Database.transaction(async tx => {
			user.money--;
			await user.useTransaction(tx).save();
			await Promise.all(workers.map(w => w.useTransaction(tx).save()));
		});

		return response.redirect('/game/workers/hire');
	}

	public async fire({ auth, request, response }: HttpContextContract) {
		let user = auth.user!;
		let id = request.param('id');

		let worker = await Worker.query()
			.where({
				id,
				userId: user.id,
				hired: true,
			})
			.firstOrFail();

		await worker.delete();
		return response.redirect('/game/workers');
	}
}
