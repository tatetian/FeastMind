class CreateCollections < ActiveRecord::Migration
  def change
    create_table :collections do |t|
      t.integer :user_id
      t.integer :doc_id

      t.timestamps
    end

    add_index :collections, :user_id
    add_index :collections, :doc_id
    add_index :collections, [:user_id, :doc_id], unique: true
  end
end
