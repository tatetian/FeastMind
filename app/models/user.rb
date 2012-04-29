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
              .select("docs.id,title,author,date,docid,docs.created_at")
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

  def has_doc?(params)
    if params.has_key?(:doc_id)
      doc_id = params[:doc_id]
      if self.tags.find_by_name("All").docs.find_by_id(doc_id) != nil
        return true
      else
        return false
      end
    elsif params.has_key?(:docid)
      docid = params[:docid]
      if self.tags.find_by_name("All").docs.find_by_docid(docid) != nil
        return true
      else
        return false
      end
    end
    false
  end

  def get_text(params)
    if params.has_key?(:doc_id)
      doc_id = params[:doc_id]
      {
        :doc_id   => doc_id,
        :content  => self.tags.find_by_name("All")
                              .docs.find_by_id(doc_id).content
      }
    elsif params.has_key?(:docid)
      docid = params[:docid]
      {
        :docid    => docid,
        :content  => self.tags.find_by_name("All")
                         .docs.find_by_docid(docid).content
      }
    end
    nil
  end

  def list_all_tags
    self.tags.all.map do |t|
        { :name => t.name, :num => t.collections.count }
    end
  end

  def create_tag name
    new_tag = self.tags.create(:name=>name,:user_id=>self.id)
    { id: new_tag.id, name: new_tag.name } 
  end

  def delete_tag tag_id
    Tag.delete tag_id
    { id: tag_id }
  end

  def rename_tag tag_id, new_name
    tag = Tag.find_by_id tag_id
    tag.name= new_name
    if tag.save
      return { id: tag.id, name: tag.name }
    else
      return nil
    end
  end

  def attach_tag doc_id, tag_name
    tag = self.tags.find_by_name tag_name
    # create a tag if not exists
    if tag == nil
      tag = create_tag tag_name
      tag = Tag.find_by_id tag.id
    end
    # create a new collection
    collection = tag.collections.create :doc_id => doc_id 
    return nil if collection
    { :tag_id => collection.tag_id,
      :doc_id => collection.doc_id }
  end

  def detach_tag doc_id, tag_name
    tag = self.tags.find_by_name tag_name
    return nil if tag == nil
    Collection.delete_all :tag_id => tag.id, :doc_id => doc_id
    { :tag_id => tag.id,
      :doc_id => doc_id }
  end

  def retach_tag doc_id, tag_name, new_tag_name
    attach_tag doc_id, new_tag_name if detach_tag doc_id, tag_name
  end 
end
