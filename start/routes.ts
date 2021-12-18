/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| This file is dedicated for defining HTTP routes. A single file is enough
| for majority of projects, however you can define routes in different
| files and just make sure to import them inside this file. For example
|
| Define routes in following two files
| ├── start/routes/cart.ts
| ├── start/routes/customer.ts
|
| and then import them inside `start/routes.ts` as follows
|
| import './routes/cart'
| import './routes/customer''
|
*/

import Route from '@ioc:Adonis/Core/Route';

Route.get('/login', 'AuthController.showLogin');
Route.post('/login', 'AuthController.login');
Route.get('/register', 'AuthController.showRegister');
Route.post('/register', 'AuthController.register');
Route.post('/logout', 'AuthController.logout').middleware('auth');

Route.get('/', ({ auth, response }) => {
	if (auth.isAuthenticated) {
		return response.redirect('/game');
	} else {
		return response.redirect('/login');
	}
});

Route.group(() => {
	Route.get('/', 'GameController.overview');
	Route.post('/choose-name', 'GameController.chooseName');

	Route.get('/buildings/:index', 'BuildingsController.show');
	Route.post('/buildings/:index', 'BuildingsController.store');
	Route.post('/buildings/:index/workers', 'BuildingsController.addWorker');
	Route.delete('/buildings/:index/workers/:id', 'BuildingsController.removeWorker');

	Route.get('/workers', 'WorkersController.index');
	Route.get('/workers/hire', 'WorkersController.showHire');
	Route.post('/workers/hire/recruit', 'WorkersController.recruit');
	Route.post('/workers/:id', 'WorkersController.hire');
	Route.delete('/workers/:id', 'WorkersController.fire');

	Route.get('/missions', 'MissionsController.index');
	Route.post('/missions', 'MissionsController.create');
	Route.get('/missions/:id', 'MissionsController.show');
	Route.post('/missions/:id/workers', 'MissionsController.addWorker');
	Route.delete('/missions/:id/workers/:workerId', 'MissionsController.removeWorker');
	Route.post('/missions/:id/start', 'MissionsController.startMission');

	Route.get('/wishlists/:id', 'WishlistsController.show');
	Route.post('/wishlists/:id/deliver', 'WishlistsController.deliver');

	Route.get('/market', 'MarketController.index');
	Route.get('/market/sell/:item', 'MarketController.showSell');
	Route.post('/market/sell', 'MarketController.sell');
	Route.post('market/orders/:id/buy', 'MarketController.buy');
	Route.delete('market/orders/:id', 'MarketController.withdraw');
}).prefix('/game').middleware('auth');
