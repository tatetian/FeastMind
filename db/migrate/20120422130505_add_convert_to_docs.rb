class AddConvertToDocs < ActiveRecord::Migration
  def change
    add_column :docs, :convert, :int

  end
end
