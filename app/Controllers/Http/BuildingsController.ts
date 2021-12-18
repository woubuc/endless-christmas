import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import Database from '@ioc:Adonis/Lucid/Database';
import Building from 'App/Models/Building';
import Worker from 'App/Models/Worker';
import BuildingAddWorkerValidator from 'App/Validators/BuildingAddWorkerValidator';
import BuildingStoreValidator from 'App/Validators/BuildingStoreValidator';

export default class BuildingsController {

	public async show({ auth, view, request }: HttpContextContract) {
		let index = request.param('index');
		if (index < 0 || index > 5) {
			throw new RangeError('Building index out of range');
		}

		let user = auth.user!;
		let building = user.buildings[index];
		if (building == undefined) {
			return view.render('game/buildings/create', { index });
		}

		building.workers.sort((a, b) => b.skillCrafting - a.skillCrafting);

		let availableWorkers = user.workers
			.filter(w => w.hired)
			.filter(w => w.missionId == null && w.buildingId == null)
			.sort((a, b) => b.skillCrafting - a.skillCrafting);

		if (user.needsTutorial('workbench') && building.workers.length > 0) {
			user.completeTutorial('workbench');
			await user.save();
		}

		return view.render('game/buildings/show', {
			building,
			workers: availableWorkers,
			index,
		});
	}

	public async store({ auth, request, response }: HttpContextContract) {
		let index = request.param('index');
		if (index < 0 || index > 5) {
			throw new RangeError('Building index out of range');
		}

		let user = auth.user!;
		if (user.buildings[index] != undefined) {
			throw new ReferenceError('Building already exists');
		}

		if (user.money < 50) {
			throw new Error('Not enough money');
		}

		let body = await request.validate(BuildingStoreValidator);

		await Database.transaction(async tx => {
			let building = new Building();
			building.type = body.type;
			building.userId = user.id;
			await building.useTransaction(tx).save();

			user.money -= 50;
			await user.save();
		});

		return response.redirect(`/game/buildings/${ index }`);
	}

	public async addWorker({ auth, request, response }: HttpContextContract) {let index = request.param('index');
		if (index < 0 || index > 5) {
			throw new RangeError('Building index out of range');
		}

		let user = auth.user!;
		let building = user.buildings[index];
		if (building == undefined) {
			throw new ReferenceError('Building does not exists');
		}

		if (building.workers.length >= 2) {
			throw new RangeError('Too many workers');
		}

		let body = await request.validate(BuildingAddWorkerValidator);

		let worker = await Worker.query()
			.where({
				id: body.worker,
				userId: user.id,
				hired: true,
			})
			.andWhereNull('missionId')
			.andWhereNull('buildingId')
			.firstOrFail();

		worker.buildingId = building.id;
		await worker.save();

		return response.redirect(`/game/buildings/${ index }`);
	}

	public async removeWorker({ auth, request, response }: HttpContextContract) {
		let index = request.param('index');
		if (index < 0 || index > 5) {
			throw new RangeError('Building index out of range');
		}

		let user = auth.user!;
		let building = user.buildings[index];
		if (building == undefined) {
			throw new ReferenceError('Building does not exists');
		}

		let id = request.param('id');

		let worker = await Worker.query()
			.where({
				id,
				userId: user.id,
				hired: true,
				buildingId: building.id,
			})
			.firstOrFail();

		worker.buildingId = null;
		await worker.save();

		return response.redirect(`/game/buildings/${ index }`);
	}
}
