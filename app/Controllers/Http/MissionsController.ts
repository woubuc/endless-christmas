import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import Mission, { DESTINATIONS } from 'App/Models/Mission';
import Worker from 'App/Models/Worker';
import BuildingAddWorkerValidator from 'App/Validators/BuildingAddWorkerValidator';
import MissionCreateValidator from 'App/Validators/MissionCreateValidator';
import { DateTime } from 'luxon';

export default class MissionsController {

	public async index({ view }: HttpContextContract) {
		return view.render('game/missions/index', { destinations: DESTINATIONS });
	}

	public async create({ auth, request, response }: HttpContextContract) {
		let user = auth.user!;

		let body = await request.validate(MissionCreateValidator);

		let mission = new Mission();
		mission.destinationId = body.destination;
		mission.userId = user.id;
		mission.type = body.type;
		await mission.save();

		return response.redirect(`/game/missions/${ mission.id }`);
	}

	public async show({ auth, view, request, response }: HttpContextContract) {
		let user = auth.user!;

		let id = parseInt(request.param('id'), 10);
		let mission = user.missions.find(m => m.id === id);

		if (mission == undefined) {
			return response.redirect('/game/missions');
		}

		let skill = mission.type === 'deliver' ? 'skillStrength' : 'skillStealth';
		let availableWorkers = user.workers
			.filter(w => w.hired)
			.filter(w => w.missionId == null && w.buildingId == null)
			.filter(w => w[skill] >= mission!.destination.minSkill)
			.sort((a, b) => b[skill] - a[skill]);

		return view.render('game/missions/show', { mission, workers: availableWorkers });
	}

	public async addWorker({ auth, request, response }: HttpContextContract) {
		let user = auth.user!;

		let id = parseInt(request.param('id'), 10);
		let mission = user.missions.find(m => m.id === id);
		if (mission == undefined) {
			throw new ReferenceError('Invalid mission ID');
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

		worker.missionId = mission.id;
		await worker.save();

		return response.redirect(`/game/missions/${ mission.id }`);
	}

	public async removeWorker({ auth, request, response }: HttpContextContract) {
		let user = auth.user!;

		let id = parseInt(request.param('id'), 10);
		let mission = user.missions.find(m => m.id === id);
		if (mission == undefined) {
			throw new ReferenceError('Invalid mission ID');
		}

		let workerId = parseInt(request.param('workerId'), 10);
		let worker = await Worker.query()
			.where({
				id: workerId,
				userId: user.id,
				hired: true,
				missionId: mission.id,
			})
			.firstOrFail();

		worker.missionId = null;
		await worker.save();

		return response.redirect(`/game/missions/${ id }`);
	}

	public async startMission({ auth, request, response }: HttpContextContract) {
		let user = auth.user!;

		let id = parseInt(request.param('id'), 10);
		let mission = user.missions.find(m => m.id === id);
		if (mission == undefined) {
			throw new ReferenceError('Invalid mission ID');
		}

		mission.started = DateTime.now().endOf('minute');
		await mission.save();

		return response.redirect('/game/missions');
	}

}
