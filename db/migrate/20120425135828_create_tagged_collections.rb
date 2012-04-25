class CreateTaggedCollections < ActiveRecord::Migration
  def change
    create_table :tagged_collections do |t|
      t.integer :tag_id
      t.integer :collection_id

      t.timestamps
    end
    add_index :tagged_collections, :tag_id
    add_index :tagged_collections, :collection_id
    add_index :tagged_collections, [:tag_id, :collection_id], unique: true
  end
end
