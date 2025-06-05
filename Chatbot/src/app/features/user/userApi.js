import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const userApi = createApi({
  reducerPath: 'userApi',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_BACKEND,   // points at your Express / Fastify etc.
    credentials: 'include',                 // sends cookies if auth is cookie-based
  }),
  tagTypes: ['User'],
  endpoints: (builder) => ({
    getUser: builder.query({
      query: (username) => `/verify-user/${username}`,
      providesTags: (r) => (r ? [{ type: 'User', id: r._id }] : ['User']),
    }),
    updateUser: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `/users/${id}`,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: (r, e, a) => [{ type: 'User', id: a.id }],
    }),
  }),
});

export const { useGetUserQuery, useUpdateUserMutation } = userApi;
