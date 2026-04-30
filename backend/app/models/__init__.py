from app.models.base import Base
from app.models.user import User
from app.models.truck import Truck
from app.models.driver import Driver
from app.models.load import Load
from app.models.bid import Bid
from app.models.shipment import Shipment
from app.models.consignment_note import ConsignmentNote
from app.models.return_window import ReturnWindow
from app.models.wallet import Wallet, Transaction
from app.models.notification import Notification
from app.models.otp import EmailOTP
from app.models.message import Message, MessageType

__all__ = [
    "Base", "User", "Truck", "Driver", "Load", "Bid",
    "Shipment", "ConsignmentNote", "ReturnWindow",
    "Wallet", "Transaction", "Notification", "EmailOTP",
    "Message", "MessageType",
]
