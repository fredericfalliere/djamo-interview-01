class Transaction {
  final int amount;
  final int id;
  final int initialStatus;
  final String status;

  Transaction(
      {required this.id,
      required this.amount,
      required this.initialStatus,
      required this.status});

  static String getTransactionMessage(int status) {
    switch (status) {
      case 1:
        return "Transaction initiated";
      case 2:
        return "Transaction sent";
      case 3:
        return "Transaction success";
      case 4:
        return "Transaction declined";
      case 5:
        return "Transaction abandoned";
      case 6:
        return "Transaction pending";
      case 99:
        return "Transaction status unknown";
      default:
        return "Invalid status";
    }
  }

  factory Transaction.fromJson(Map<String, dynamic> json) {
    return Transaction(
      id: json['id'],
      amount: json['amount'],
      initialStatus: json['status'],
      status: getTransactionMessage(json['status']),
    );
  }
}
