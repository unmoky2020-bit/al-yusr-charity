<?php

namespace App\Http\Controllers\Api\V1\Donor;

use App\Models\Donor;
use App\Http\Controllers\Controller;
use App\Http\Resources\DonorResource;
use App\Http\Requests\Donor\StoreDonorRequest;
use App\Http\Requests\Donor\UpdateDonorRequest;

class DonorController extends Controller
{
    public function index()
    {
        return DonorResource::collection(
            Donor::latest()->paginate(\App\Support\PerPage::from(request(), 10))
        );
    }

    public function store(StoreDonorRequest $request)
    {
        return new DonorResource(
            Donor::create($request->validated())
        );
    }

    public function show(Donor $donor)
    {
        return new DonorResource($donor);
    }

    public function update(UpdateDonorRequest $request, Donor $donor)
    {
        $donor->update($request->validated());

        return new DonorResource($donor);
    }

    public function destroy(Donor $donor)
    {
        $donor->delete();

        return response()->json([
            'message'=>'Deleted Successfully'
        ]);
    }
}
