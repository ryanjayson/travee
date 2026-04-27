import React from "react";
import { View, ActivityIndicator } from "react-native";
import { Text, DataTable, useTheme } from "react-native-paper";
import { TravelPlan, ItineraryExpense } from "../../../../Travel/types/TravelDto";
import { useItineraryExpenses } from "../../../hooks/useExpense";
import ExpenseCategoryIcon from "../../Forms/Expense/ExpenseCategoryIcon";

interface ExpensesTabProps {
  travelPlan: TravelPlan;
  onEditExpense?: (expense: ItineraryExpense) => void;
}

const ExpensesTab = ({ travelPlan, onEditExpense }: ExpensesTabProps) => {
  const { colors } = useTheme();
  const { data: expenses, isLoading } = useItineraryExpenses(travelPlan.travel.id || "");

  if (isLoading) {
    return (
      <View className="items-center justify-center py-10">
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const totalAmount = expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;

  const sortedExpenses = expenses ? [...expenses].sort((a, b) => {
    const timeA = new Date(a.dateTime || 0).getTime();
    const timeB = new Date(b.dateTime || 0).getTime();
    return timeB - timeA;
  }) : [];

  return (
    <View className="px-4 py-2">
      <View className="bg-white rounded-[24px] overflow-hidden border border-gray-100 shadow-sm mb-4">
        <DataTable>
          <DataTable.Header className="bg-gray-50/50">
            <DataTable.Title textStyle={{ color: colors.onSurfaceVariant, fontSize: 12, fontWeight: '600' }}>Item</DataTable.Title>
            <DataTable.Title textStyle={{ color: colors.onSurfaceVariant, fontSize: 12, fontWeight: '600' }}>Category</DataTable.Title>
            <DataTable.Title numeric textStyle={{ color: colors.onSurfaceVariant, fontSize: 12, fontWeight: '600' }}>Date</DataTable.Title>
            <DataTable.Title numeric textStyle={{ color: colors.onSurfaceVariant, fontSize: 12, fontWeight: '600' }}>Amount</DataTable.Title>
          </DataTable.Header>

          {sortedExpenses.length > 0 ? (
            sortedExpenses.map((expense, index) => (
              <DataTable.Row 
                key={expense.id || index} 
                className="border-b-0"
                onPress={() => onEditExpense?.(expense)}
              >
                <DataTable.Cell textStyle={{ fontSize: 14, fontWeight: '500', color: '#1A1A1A' }}>
                  {expense.title}
                </DataTable.Cell>
                <DataTable.Cell>
                   <ExpenseCategoryIcon category={expense.expenseCategory} size={24} color={colors.primary} />
                </DataTable.Cell>
                <DataTable.Cell numeric textStyle={{ fontSize: 12, color: colors.secondary }}>
                  {(() => {
                    const d = new Date(expense.dateTime);
                    return d.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' }) + 
                           " " + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
                  })()}
                </DataTable.Cell>
                <DataTable.Cell numeric textStyle={{ fontSize: 14, fontWeight: '700', color: colors.primary }}>
                  {expense.currency || '$'}{expense.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </DataTable.Cell>
              </DataTable.Row>
            ))
          ) : (
            <View className="py-10 items-center">
              <Text className="text-gray-400 text-sm">No expenses recorded for this trip.</Text>
            </View>
          )}

          {expenses && expenses.length > 0 && (
            <DataTable.Row className="bg-gray-50/30 border-t border-gray-100">
              <DataTable.Cell textStyle={{ fontWeight: '700', color: '#1A1A1A' }}>Total</DataTable.Cell>
              <DataTable.Cell numeric textStyle={{ fontWeight: '800', color: colors.primary, fontSize: 16 }}>
                ${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </DataTable.Cell>
            </DataTable.Row>
          )}
        </DataTable>
      </View>
    </View>
  );
};

export default ExpensesTab;
