class Tag < ActiveRecord::Base
  attr_accessible :id, :name, :user_id
  validates :user_id, presence: true
  validates :name, presence: true, length: {maximum:100}

  belongs_to :user
  has_many :tagged_collections, foreign_key: "tag_id",dependent:   :destroy
  has_many :collections, through: :tagged_collections

  default_scope order: 'tags.name ASC'
end
