class User < ActiveRecord::Base
  attr_accessible :name, :email, :password, :password_confirmation
  has_secure_password
  #has_many :collections, foreign_key: "user_id", dependent: :destroy
  #has_many :docs, through: :collections
  has_many :tags, dependent: :destroy
  
  before_save :create_remember_token
  after_save { |user|
    # create a default tag for every user
    # All tags will be tagged as All
    Tag.create :name => "All", :user_id =>  user.id
  }


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
#    self.collections.find_by_doc_id(doc.id)
  end

  def collect!(doc)
    tag = self.tags.find_by_name "All"
    tag.collections.create!(doc_id: doc.id)
  end

  def uncollect!(doc)
#    self.collections.find_by_doc_id(doc.id).destroy
  end

  def list_all_docs(params={})
    params[:tag] = "All"
    search_docs params 
  end

  def search_docs(params={})
    # find tag
    tag_name = params[:tag]
    tag = self.tags.find_by_name tag_name
    return { :total => 0, :entries => [] } if tag == nil
    # init variables
    start, limit, keywords = params[:start], params[:limit], params[:keywords]
    start ||= 0
    limit ||= 10
    keywords ||= ""
    entries = 
      tag.docs.offset(start)
              .limit(limit)
              .where("title LIKE '%#{keywords}%' OR "+
                    "author LIKE '%#{keywords}%'")
              .select("docs.id,title,author,date,docs.created_at")
              .map { |doc| 
                      d = doc.attributes
                      d[:tags] = doc.tags.map { |t| t.name } 
                      d
              }
    # total
    total = tag.docs.where("title LIKE '%#{keywords}%' OR "+
                            "author LIKE '%#{keywords}%'").count
    # result
    { :total => total, :entries => entries }
  end
end
