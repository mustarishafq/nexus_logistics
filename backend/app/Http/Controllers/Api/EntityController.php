<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

abstract class EntityController extends Controller
{
    abstract protected function modelClass(): string;

    public function index(Request $request): JsonResponse
    {
        $modelClass = $this->modelClass();
        $query = $modelClass::query();

        $this->applyFilters($query, $request);
        $this->applySort($query, $request->query('sort', '-created_at'));
        $this->applyLimit($query, (int) $request->query('limit', 100));

        $items = $query->get()->map(fn (Model $model) => $model->toApiArray());

        return response()->json($items);
    }

    public function store(Request $request): JsonResponse
    {
        $modelClass = $this->modelClass();
        $model = $modelClass::create($request->all());

        return response()->json($model->toApiArray(), 201);
    }

    public function destroy(string $id): JsonResponse
    {
        $modelClass = $this->modelClass();
        $modelClass::query()->whereKey($id)->delete();

        return response()->json(['message' => 'Deleted.']);
    }

    public function bulkStore(Request $request): JsonResponse
    {
        $request->validate(['records' => 'required|array']);
        $modelClass = $this->modelClass();
        $created = [];

        foreach ($request->input('records') as $record) {
            $created[] = $modelClass::create($record)->toApiArray();
        }

        return response()->json($created, 201);
    }

    protected function applyFilters(Builder $query, Request $request): void
    {
        foreach ($request->query() as $key => $value) {
            if (in_array($key, ['sort', 'limit'], true) || $value === null || $value === '') {
                continue;
            }

            $query->where($key, $value);
        }
    }

    protected function applySort(Builder $query, string $sort): void
    {
        $direction = str_starts_with($sort, '-') ? 'desc' : 'asc';
        $column = ltrim($sort, '-');
        $column = $column === 'created_date' ? 'created_at' : $column;

        $query->orderBy($column, $direction);
    }

    protected function applyLimit(Builder $query, int $limit): void
    {
        if ($limit > 0) {
            $query->limit($limit);
        }
    }
}
