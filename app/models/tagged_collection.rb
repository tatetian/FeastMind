class TaggedCollection < ActiveRecord::Base
  attr_accessible :tag_id, :collection_id

  belongs_to :tag
  belongs_to :collection

  validates :tag_id, presence: true
  validates :collection_id, presence: true

end
