class User < ActiveRecord::Base
   attr_accessible :name, :email, :password, :password_confirmation
  has_secure_password
  has_many :collections, foreign_key: "user_id", dependent: :destroy
  has_many :docs, through: :collections
  has_many :tags, dependent: :destroy
  
  before_save :create_remember_token

  validates :name, presence: true, length: { maximum: 50 }
  VALID_EMAIL_REGEX = /\A[\w+\-.]+@[a-z\d\-.]+\.[a-z]+\z/i
  validates :email, presence:   true,
                    format:     { with: VALID_EMAIL_REGEX },
                    uniqueness: { case_sensitive: false }
  validates :password, length: { minimum: 6 }
  validates :password_confirmation, presence: true
  def create_remember_token
    self.remember_token = SecureRandom.urlsafe_base64
  end
  def collect?(doc)
    self.collections.find_by_doc_id(doc.id)
  end

  def collect!(doc)
    self.collections.create!(doc_id: doc.id)
  end

  def uncollect!(doc)
    self.collections.find_by_doc_id(doc.id).destroy
  end
end
