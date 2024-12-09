import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'models.dart';

part 'main.g.dart';

const String THIRDPARTY_URL = "localhost:3200";

void main() {
  runApp(const ProviderScope(child: App()));
}

class App extends StatelessWidget {
  const App({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Transactions app',
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.lightBlue),
      ),
      home: const HomePage(),
    );
  }
}

@riverpod
class TransactionState extends _$TransactionState {
  late IO.Socket socket;

  @override
  Future<List<Transaction>> build() async {
    // Initialize socket connection
    socket = IO.io(
      'http://$THIRDPARTY_URL',
      IO.OptionBuilder().setTransports(['websocket']).build(),
    );
    socket.connect();

    // Setup socket listeners
    socket.onConnect((_) => print("Socket connected!"));
    _setupSocketListeners();

    // Initial HTTP load
    final response = await http.get(
      Uri.http(THIRDPARTY_URL, '/transactions'),
    );
    final List<dynamic> data = jsonDecode(response.body) as List;

    return data.map((json) => Transaction.fromJson(json)).toList();
  }

  void _setupSocketListeners() {
    // Handle new transactions
    socket.on('newTransaction', (data) {
      print("New transaction received!");
      final transaction = Transaction.fromJson(data);
      state.whenData((transactions) {
        state = AsyncValue.data([transaction, ...transactions]);
      });
    });

    // Handle transaction updates
    socket.on('transactionUpdated', (data) {
      print("Transaction update received!");
      final updatedTransaction = Transaction.fromJson(data);
      state.whenData((transactions) {
        final updatedList = transactions.map((t) {
          return t.id == updatedTransaction.id ? updatedTransaction : t;
        }).toList();
        state = AsyncValue.data(updatedList);
      });
    });
  }

  void dispose() {
    socket.disconnect();
    socket.dispose();
  }
}

class TransactionsWidget extends ConsumerWidget {
  const TransactionsWidget({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final transactions = ref.watch(transactionStateProvider);

    return Scaffold(
      appBar: AppBar(
          title: transactions.when(
        data: (List<Transaction> data) =>
            Text("We have a total number of ${data.length} transations"),
        error: (Object error, StackTrace stackTrace) =>
            Text("Error loading transactions : ${error.toString()}}"),
        loading: () => const Center(child: CircularProgressIndicator()),
      )),
      body: transactions.when(
        data: (transactions) => ListView.builder(
          itemCount: transactions.length,
          itemBuilder: (context, index) {
            final transaction = transactions[index];
            return ListTile(
              leading: CircleAvatar(
                child: Text('${transaction.id}'),
              ),
              title: Text('Amount: \$${transaction.amount}'),
              subtitle: Text('Status: ${transaction.status}'),
              trailing: StatusIconWidget(transaction: transaction),
            );
          },
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => Center(child: Text('Erreur : $error')),
      ),
    );
  }
}

class StatusIconWidget extends StatelessWidget {
  const StatusIconWidget({
    super.key,
    required this.transaction,
  });

  final Transaction transaction;

  @override
  Widget build(BuildContext context) {
    if (transaction.initialStatus == 1) {
      return const Icon(Icons.start, color: Colors.grey);
    } else if (transaction.initialStatus == 2) {
      return const Icon(Icons.outbox, color: Colors.grey);
    } else if (transaction.initialStatus == 3) {
      return const Icon(Icons.verified, color: Colors.green);
    } else if (transaction.initialStatus == 4) {
      return const Icon(Icons.cancel, color: Colors.red);
    } else if (transaction.initialStatus == 5) {
      return const Icon(Icons.delete, color: Colors.orange);
    } else if (transaction.initialStatus == 6) {
      return const Icon(Icons.hourglass_empty, color: Colors.orange);
    } else {
      return const Icon(Icons.question_mark, color: Colors.grey);
    }
  }
}

class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return const MaterialApp(home: TransactionsWidget());
  }
}
