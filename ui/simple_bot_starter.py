import logging
from telegram import Update
from telegram.ext import Application, ContextTypes, CommandHandler
import requests

logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await context.bot.send_message(chat_id=update.effective_chat.id,
     text="I'm a bot, please talk to me!")
    
async def checkBalance(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        f"Awesome, now checking balance"
    )
   # Set the endpoint URL
    endpoint_url = "http://localhost:3000/"


    # Send the request
    response = requests.get(endpoint_url)

    # Check the response
    if response.status_code == 200:
        print("API call successful!")
        await update.message.reply_text(
        response.text
    )
    else:
        print("Error calling API: {}".format(response.text))
    

if __name__ == '__main__':
    application = Application.builder().token('Token').build()
    
    start_handler = CommandHandler('start', start)
    application.add_handler(start_handler)
    application.add_handler(CommandHandler('checkBalance', checkBalance))
    
    application.run_polling()



