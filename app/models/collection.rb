class Collection < ActiveRecord::Base
  attr_accessible :doc_id,:user_id

  belongs_to :user
  belongs_to :doc

  validates :user_id, presence: true
  validates :doc_id, presence: true
end
