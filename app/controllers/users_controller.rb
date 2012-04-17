class UsersController < ApplicationController
  def new
  @user = User.new
  end

  def show
  @user = User.find(params[:id])
  end
  
   def create
    @user = User.new(params[:user])
    @user.password_confirmation = @user.password
    if @user.save
      sign_in @user
      flash[:success] = "Welcome to the Sample App!"
      redirect_to "/manager"
    else
      render 'new'
    end
  end
end
