class TagsController < ApplicationController
  def index
    user = current_user
    result = user.tags.all.map do |t|
        { :name => t.name, :num => t.collections.count }
    end
    response = { :error => nil, :tags => result }
    json = ActiveSupport::JSON.encode response
    respond_to do |format| 
        format.html { head :no_content }
        format.json { 
            render :json => json 
        }
    end 
  end

  def create
    user = current_user
    tag = Tag.new(name: params[:name],user_id: user.id)
    if tag.save    
        respond_to do |format| 
            format.html { head :no_content }
            format.json { render :json => '{"error":null}'}
        end        
    else
        respond_to do |format| 
            format.html { head :no_content }
            format.json { render :json => '{"error":"'+tag.errors.full_messages.join(";")+'"}'}
        end
    end 
  end

  def destroy
  end
end
