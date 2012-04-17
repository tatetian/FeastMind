class ManagerController < ApplicationController
  before_filter :signed_in_user
  def index
  
  end
  
  private
  
  def signed_in_user
      redirect_to login_path, notice: "Please sign in." unless signed_in?
  end
    
end
