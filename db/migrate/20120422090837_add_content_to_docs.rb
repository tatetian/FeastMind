class AddContentToDocs < ActiveRecord::Migration
  def change
    add_column :docs, :content, :text

  end
end
