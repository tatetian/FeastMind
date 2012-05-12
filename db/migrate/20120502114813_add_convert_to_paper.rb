class AddConvertToPaper < ActiveRecord::Migration
  def change
      add_column :papers, :convert, :int
  end
end
