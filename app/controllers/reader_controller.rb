class ReaderController < ApplicationController
  before_filter :signed_in_user
  
  def index
      @docid=params[:docid]
      redirect_to manager_path, notice: "You don't have this paper." unless current_user.has_doc? params
  end 
  
  private
  
  def signed_in_user
      redirect_to login_path, notice: "Please sign in." unless signed_in?
  end
  
end
