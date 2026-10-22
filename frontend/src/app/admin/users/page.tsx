'use client';

import React from 'react';
import { RefreshCw } from 'lucide-react';
import { useAdminUsers } from '@/features/admin/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function AdminUsersPage() {
  const { data: users, isLoading, isError, refetch } = useAdminUsers();

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Customers and Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">Accounts returned by the admin users API.</p>
        </div>
        <Button onClick={() => void refetch()} variant="outline" size="sm" className="h-9">
          <RefreshCw className="h-4 w-4" />
          <span className="sr-only">Refresh users</span>
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {isLoading ? (
          <div className="space-y-4 p-6" role="status" aria-label="Loading users">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : isError ? (
          <div className="p-8 text-center">
            <p role="alert" className="text-sm text-destructive">Users could not be loaded from the backend.</p>
            <Button onClick={() => void refetch()} variant="outline" size="sm" className="mt-4">Try again</Button>
          </div>
        ) : !users?.length ? (
          <p className="p-8 text-center text-sm text-muted-foreground">No user accounts were returned.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell className="capitalize">{user.role.toLowerCase()}</TableCell>
                    <TableCell>
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
