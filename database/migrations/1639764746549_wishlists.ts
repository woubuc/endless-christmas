import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class Wishlists extends BaseSchema {
	protected tableName = 'wishlists';

	public async up() {
		this.schema.createTable(this.tableName, (table) => {
			table.increments('id');
			table.integer('user_id').unsigned().notNullable()
				.references('users.id').onDelete('cascade');

			table.string('destination_id').notNullable();
			table.json('items').notNullable();
		});
	}

	public async down() {
		this.schema.dropTable(this.tableName);
	}
}
