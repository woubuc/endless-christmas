import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class UsersTutorials extends BaseSchema {
	public async up() {
		this.schema.alterTable('users', (table) => {
			table.json('tutorial').notNullable().defaultTo('{}');
		});
	}

	public async down() {
		this.schema.alterTable('users', (table) => {
			table.dropColumn('tutorial');
		});
	}
}
