import logging
from telegram import ReplyKeyboardMarkup, ReplyKeyboardRemove, Update
from telegram.ext import (
    Application,
    CommandHandler,
    ContextTypes,
    ConversationHandler,
    MessageHandler,
    filters,
)
import requests

logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)

BALANCE = range(1)


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    reply_keyboard = [["Yes", "No"]]
    await context.bot.send_message(chat_id=update.effective_chat.id,
                                   text="Do you want to check your balance?",
                                   reply_markup=ReplyKeyboardMarkup(
                                       reply_keyboard, one_time_keyboard=True, input_field_placeholder="Yes/No"
                                   ),)

    return BALANCE

async def checkBalance(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        f"Awesome, now checking balance"
    )

   # Set the endpoint URL
    endpoint_url = "http://localhost:3000/"


    # Send the request
    response = requests.post(endpoint_url)

    # Check the response
    if response.status_code == 200:
        print("API call successful!")
        await update.message.reply_text(
        response.text
    )
    else:
        print("Error calling API: {}".format(response.text))


async def cancel(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    user = update.message.from_user
    await update.message.reply_text(
        f"Bye {user.first_name}! I hope we can talk again some day.", reply_markup=ReplyKeyboardRemove()
    )

    return ConversationHandler.END

if __name__ == '__main__':
    application = Application.builder().token('1433555369:AAF4KbunZ69OB7-DOIy6TpJBRSvnOrLvXYc').build()
    
    conv_handler = ConversationHandler(
        entry_points=[
            CommandHandler("start", start),
            CommandHandler("help", help),
            CommandHandler("checkBalance", checkBalance),
            ],
        states={
            BALANCE: [MessageHandler(filters.Regex("^(Yes|No)$"), checkBalance)],
        },
        fallbacks=[CommandHandler("cancel", cancel)],
    )

    application.add_handler(conv_handler)    
    application.run_polling()




