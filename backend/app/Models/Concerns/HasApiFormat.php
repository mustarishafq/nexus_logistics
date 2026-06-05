<?php

namespace App\Models\Concerns;

use DateTimeInterface;

trait HasApiFormat
{
    public function toApiArray(): array
    {
        $data = $this->toArray();
        $data['id'] = (string) $this->getKey();

        foreach ($this->getCasts() as $field => $cast) {
            $value = $this->getAttribute($field);

            if ($value === null) {
                continue;
            }

            if ($cast === 'date' && $value instanceof DateTimeInterface) {
                $data[$field] = $value->format('d/m/Y');
            }

            if (in_array($cast, ['datetime', 'immutable_datetime'], true) && $value instanceof DateTimeInterface) {
                $data[$field] = $value->format('d/m/Y H:i');
            }
        }

        if ($this->created_at) {
            $data['created_date'] = $this->created_at->format('d/m/Y H:i');
        }

        unset($data['created_at'], $data['updated_at']);

        return $data;
    }
}
