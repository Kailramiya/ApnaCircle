import type { ReactElement } from 'react';
import { FlatList, View } from 'react-native';
import type { InfiniteData, UseInfiniteQueryResult } from '@tanstack/react-query';
import { uniqueRows } from '@/lib/pagination';
import { Button, EmptyState, Loading, Notice, styles } from './ui';
import { useI18n } from '@/store/preferences';
import { space } from '@/theme';

export function PagedList<T extends { id: string }>({ query, renderItem, header, emptyTitle, emptyBody }: {
  query: UseInfiniteQueryResult<InfiniteData<T[]>, Error>;
  renderItem: (item: T) => ReactElement; header?: ReactElement; emptyTitle: string; emptyBody?: string;
}) {
  const { t } = useI18n();
  const rows = uniqueRows(query.data?.pages);
  return <FlatList data={rows} renderItem={({ item }) => renderItem(item)} keyExtractor={(item) => item.id}
    contentContainerStyle={[styles.content, { gap: space.lg }]} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"
    initialNumToRender={6} maxToRenderPerBatch={6} windowSize={7}
    refreshing={query.isRefetching && !query.isFetchingNextPage} onRefresh={() => { void query.refetch(); }}
    onEndReachedThreshold={0.4} onEndReached={() => { if (query.hasNextPage && !query.isFetching && !query.isFetchNextPageError) void query.fetchNextPage(); }}
    ListHeaderComponent={<View style={{ gap: space.lg }}>{header}{query.isError && !query.isFetchNextPageError && rows.length > 0 ? <Notice error message={t('refreshFailed')} onRetry={() => { void query.refetch(); }} /> : null}</View>}
    ListEmptyComponent={query.isPending ? <Loading /> : query.isError ? <Notice error message={t('networkError')} onRetry={() => { void query.refetch(); }} /> : <EmptyState title={emptyTitle} body={emptyBody} />}
    ListFooterComponent={query.isFetchingNextPage ? <Loading /> : query.hasNextPage ? <Button variant="secondary" title={t(query.isFetchNextPageError ? 'retry' : 'loadMore')} onPress={() => { void query.fetchNextPage(); }} /> : null}
  />;
}
