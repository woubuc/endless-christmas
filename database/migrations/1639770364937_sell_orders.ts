import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class SellOrders extends BaseSchema {
	protected tableName = 'sell_orders';

	public async up() {
		this.schema.createTable(this.tableName, (table) => {
			table.increments('id');

			table.integer('user_id').unsigned().nullable()
				.references('users.id').onDelete('cascade');

			table.string('item').notNullable();
			table.integer('amount').unsigned().notNullable();
			table.integer('price').unsigned().notNullable();
		});
	}

	public async down() {
		this.schema.dropTable(this.tableName);
	}
}
